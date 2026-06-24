// archivos css modules, devuelve un objeto de clases
declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}

// archivos css globales, side-effect imports (sin export)
declare module '*.css' {
    const css: string;
    export default css;
}