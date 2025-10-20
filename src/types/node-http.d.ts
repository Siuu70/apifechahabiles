declare module "node:http" {
  export interface IncomingMessage {
    readonly method?: string;
    readonly url?: string;
  }

  export interface ServerResponse {
    statusCode: number;
    setHeader(name: string, value: string): void;
    end(data?: string): void;
  }

  export type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;

  export interface Server {
    listen(port: number, callback?: () => void): void;
  }

  export function createServer(listener: RequestListener): Server;
}
