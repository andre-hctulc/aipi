import cdk from "aws-cdk-lib";
import lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path from "path";
import fs from "fs";

const HANDLERS_DIR = path.join(__dirname, "../src/api");
const DEV_MODE = process.env.NODE_ENV === "development";
const NS = "cis";

export class CISStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const handlers = fs.readdirSync(HANDLERS_DIR);
        this.defineFunctions(handlers);
    }

    private defineFunctions(handlers: string[]) {
        handlers.forEach((handler) => {
            if (!handler.endsWith(".ts")) return;

            const baseName = path.basename(handler, ".ts");

            // -- Define th Lambda Function --
            new lambda.Function(this, handler, {
                runtime: lambda.Runtime.NODEJS_18_X,
                handler: baseName + ".handler",
                code: lambda.Code.fromAsset(HANDLERS_DIR),
                functionName: this.funName(baseName),
            });
        });
    }

    private funName(handler: string) {
        return NS + "-" + handler;
    }
}
