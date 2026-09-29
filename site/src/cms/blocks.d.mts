export interface Block { kind: string; id: string; unknown: boolean; fields: Record<string, any>; rendered: Record<string, any>; pos: number; ord?: number }
export interface BlockCtx { type: string; route: string; components: Record<string, any>; eagerFirstBand?: boolean }
export declare function fnv(s: string): string;
export declare const onceId: (route: string, kind: string) => string;
export declare const BLOCK_ID_RE: RegExp;
export declare const blank: (v: unknown) => boolean;
export declare function blocksSpec(type: string): any;
export declare function kindSpec(type: string, kind: string): any;
export declare const isFlow: (type: string, kind: string) => boolean;
export declare function blocksOf(type: string, route: string, fields: any, rendered: any): Block[];
export declare const bf: (b: Block, id: string) => any;
export declare const br: (b: Block, id: string) => any;
