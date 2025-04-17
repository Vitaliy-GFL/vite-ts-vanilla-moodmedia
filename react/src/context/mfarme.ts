import { getMFparam } from "@/utils";
import { createContext } from "react";

const MframeContexts = createContext<(<T>(a: string, b: string) => ReturnType<typeof getMFparam<T>>) | null>(null);

export default MframeContexts;
