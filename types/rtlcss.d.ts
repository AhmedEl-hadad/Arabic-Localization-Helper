declare module 'rtlcss' {
  interface RtlcssOptions {
    // Add options if needed in the future
    [key: string]: any;
  }

  interface Rtlcss {
    process(css: string, options?: RtlcssOptions): string;
  }

  const rtlcss: Rtlcss;
  export default rtlcss;
}

