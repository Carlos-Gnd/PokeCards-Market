export interface SessionUser {
    id: string;
    email: string;
    username: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
