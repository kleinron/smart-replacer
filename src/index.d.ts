interface ReplacerFunction {
    (key: string, value: any): any;
}

interface IReplacer {
    canHandle (key, value): boolean;
    replace (key, value) : any
}

interface ReplacerOptions {
    replacers?: IReplacer[],
    useErrorReplacer?: boolean;
    useMapReplacer?: boolean;
    useSetReplacer?: boolean;
    monkeyPatchJSON?: boolean;
}

export function createReplacerFunction(options?: ReplacerOptions): ReplacerFunction;
