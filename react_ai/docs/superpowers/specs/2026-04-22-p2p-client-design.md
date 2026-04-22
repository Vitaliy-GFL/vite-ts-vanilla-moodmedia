# P2PClient — дизайн

Дата: 2026-04-22
Файл: `src/services/api/p2p.ts`

## Мета

Замінити поточні функції `joinChannel` / `sendChannelMessage` / `sendChannelMessageJson` у `src/services/api/p2p.ts` на клас `P2PClient`, який:

- Інкапсулює join-to-channel + єдиний внутрішній dispatcher callback
- Веде pub/sub по типах повідомлень (`on` / `emit`)
- Автоматично шле `ping` при підʼєднанні та відповідає `pong` на чужі `ping`
- У серверному режимі періодично пінгує канал і веде список пірів з online-статусом

## Публічний API

```ts
type Envelope = { type: string; clientId: string; data?: unknown };
type MessageHandler = (data: unknown, fromClientId: string) => void;
type Peer = { clientId: string; online: boolean; lastSeen: number };

class P2PClient {
  constructor(channelName: string, clientId: string, isServer?: boolean);

  on(type: string, handler: MessageHandler): void;
  emit(type: string, data?: unknown): void;
  getPeers(): Peer[];
}
```

### Семантика

- **`constructor(channelName, clientId, isServer = false)`**
  - Викликає `window.Loader.joinChannel(clientId, channelName, dispatcher)` — реєструє **один** внутрішній callback.
  - Відразу шле початковий `ping` у канал (через `emit("ping")`).
  - Якщо `isServer === true` — запускає `setInterval(60_000)` для периодичного `emit("ping")` та оцінки online-статусу пірів.
  - Callback для Loader реєструється як глобальна властивість `window["__p2pCb_<N>"]` з унікальним лічильником на інстанс (вимога Android-плеєра; існуючий патерн).

- **`on(type, handler)`**
  - Додає `handler` у `Map<string, MessageHandler[]>`.
  - Відписки немає (YAGNI — темплейт живе до `finished()`).
  - `once()` не передбачено.

- **`emit(type, data?)`**
  - Формує envelope `{ type, clientId: self.clientId, data }`, серіалізує `JSON.stringify`, шле через `window.Loader.sendChannelMessage(self.clientId, channelName, payload)`.

- **`getPeers()`**
  - Повертає знімок `Peer[]` (копію, а не внутрішній масив).
  - У client-режимі (`isServer === false`) список пірів **не ведеться** → повертає `[]`.

## Внутрішня поведінка dispatcher

Для кожного вхідного `(senderId, _channel, payload)`:

1. **Парсинг**. Спроба `JSON.parse(payload)`. Якщо зламалось або немає полів `type`/`clientId` — `console.warn("P2PClient: malformed message", payload)`, далі не йдемо.
2. **Echo-filter**. Якщо `envelope.clientId === self.clientId` — ігнор.
3. **Оновлення peer registry** (тільки якщо `isServer`):
   - Якщо піра з `envelope.clientId` немає в мапі — додаємо з `online: true, lastSeen: Date.now()`.
   - Якщо є — оновлюємо `lastSeen = Date.now()` та `online = true`.
4. **Авто-понг**. Якщо `envelope.type === "ping"` — викликаємо `self.emit("pong")`. Після цього *продовжуємо* диспатч (щоб підписки на `"ping"` теж спрацювали).
5. **Dispatch**. Для кожного `handler` у `handlers.get(type) ?? []` — викликаємо `handler(envelope.data, envelope.clientId)` у `try/catch`; помилка логується через `console.error`, решта хендлерів продовжують працювати.

## Server-режим: heartbeat та online-статус

- Початковий ping у конструкторі шлеться в **обох** режимах (щоб інші вузли одразу відповіли `pong` і оновили свій стан). Різниця лише в тому, чи запускається далі цикл оцінки.
- Якщо `isServer === true`: після початкового ping у конструкторі одразу ставимо `setTimeout(() => evaluate(initialPingTime), 3_000)`, а також запускаємо `setInterval(() => tick(), 60_000)`.
- `tick()`:
  1. `const pingTime = Date.now();`
  2. `self.emit("ping");`
  3. `setTimeout(() => evaluate(pingTime), 3_000);`
- `evaluate(pingTime)`:
  - Для кожного піра в мапі: `peer.online = peer.lastSeen >= pingTime`.
  - Пірів **не видаляємо** — лишаються з `online: false` аж поки не зʼявляться знов.
- Client-режим: шле тільки початковий `ping` у конструкторі, peer registry не тримає, `getPeers()` завжди повертає `[]`.
- Власний `clientId` ніколи не потрапляє у peer registry (echo-filter у dispatcher-і відкидає самого себе).

## Структура файлу

`src/services/api/p2p.ts` після рефакторингу:

- Експорт типів: `Envelope`, `MessageHandler`, `Peer`
- Експорт класу: `P2PClient`
- Більше **не** експортує: `joinChannel`, `sendChannelMessage`, `sendChannelMessageJson`, `ChannelMessageCallback`
- Глобальний лічильник `p2pCallbackCounter` переїжджає в модульний scope поза класом — лічить callback-імена кросс-інстанс.

## Помилки та edge cases

- **Non-JSON payload** → `console.warn`, не падаємо.
- **Envelope без `type` або `clientId`** → `console.warn`, не падаємо.
- **Помилка в user handler** → `console.error`, інші handler-и продовжують.
- **`emit` до того як Loader доступний** → не обробляємо спеціально; `new P2PClient()` викликається з прикладного коду після `isStarted()`, тож `window.Loader` гарантовано є (той самий контракт що й у решти API-модулів).

## Оновлення документації (паралельно з рефакторингом)

### CLAUDE.md

Секція `Player API` згадує `src/services/api/p2p.ts` коротко. Оновити:

- Додати пункт що `p2p.ts` тепер експортує клас `P2PClient` з pub/sub API, auto-ping/pong та опціональним серверним heartbeat.
- Приклад використання (кілька рядків):

  ```ts
  const p2p = new P2PClient("my-channel", "Device-A", true /* isServer */);
  p2p.on("score", (data, from) => console.log(from, data));
  p2p.emit("score", { points: 42 });
  const peers = p2p.getPeers();
  ```

- Згадати що ping/pong — автоматичні (`"ping"` та `"pong"` як зарезервовані типи).

### Коментарі в коді

Один короткий коментар біля глобальної реєстрації callback в класі — пояснити чому `Object.defineProperty(window, ...)` (Android-плеєр). Більше коментарів не додавати.

## Що НЕ робимо (YAGNI)

- Жодного `off`, `once`, `dispose`, `leave`.
- Не тримаємо peer registry у client-режимі.
- Не експоруємо `setPingInterval`, `setGraceTimeout` — значення фіксовані (60_000 / 3_000) до появи реального use case.
- Не робимо peer-events (`peerOnline`/`peerOffline`) — споживач читає `getPeers()` тоді, коли йому треба.

## План тестування (вручну)

- Відкрити темплейт в dev з `new P2PClient("test", "A")` + другим інстансом `"B"`, перевірити що `B` отримує `ping` від `A` й відповідає `pong`.
- Увімкнути `isServer: true` на одному інстансі — через 60 сек перевірити що `getPeers()` містить інших клієнтів з `online: true`; вимкнути одного — через ~63 сек `online: false`.
- Зламаний payload (замінити `sendChannelMessage` на не-JSON) → `console.warn` без падіння.
