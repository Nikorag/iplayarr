import fs from 'fs';

export abstract class Validator {
    abstract validate(input : any) : Promise<{[key : string] : string}>

    directoryExists(val : string){
        return fs.existsSync(val);
    }

    isNumber(val: string | number): boolean {
        return !isNaN(Number(val));
    }

    matchesRegex(val: string, regexp: RegExp): boolean {
        return regexp.test(val);
    }
}