export interface OutputStream {

    write(content: string): void;
    writeLine(content: string): void;

    flush(): Promise<void>;

}
