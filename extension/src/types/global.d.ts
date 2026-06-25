/// <reference types="chrome" />

// css modules
declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}

// css globales (side-effect imports)
declare module '*.css' {
    const css: string;
    export default css;
}