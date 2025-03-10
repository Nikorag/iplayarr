import { template } from "handlebars";
import { Validator } from "./Validator";
import Handlebars from "handlebars";
import { FilenameTemplateContext } from "../types/FilenameTemplateContext";

const cronRegex : RegExp = /^(\*|([0-5]?[0-9])) (\*|([01]?[0-9]|2[0-3])) (\*|([01]?[1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])) (\*|([0-6]))(\s(\d{4}))?$/

export class ConfigFormValidator extends Validator {
    validate(input: any): {[key: string]: string} {
        const validatorError : { [key: string]: string; } = {};
        if (!this.directoryExists(input.DOWNLOAD_DIR)){
            validatorError["DOWNLOAD_DIR"] = `Directory ${input.DOWNLOAD_DIR} does not exist`;
        }
        if (!this.directoryExists(input.COMPLETE_DIR)){
            validatorError["COMPLETE_DIR"] = `Directory ${input.COMPLETE_DIR} does not exist`;
        }
        if (!this.isNumber(input.ACTIVE_LIMIT)){
            validatorError["ACTIVE_LIMIT"] = `Download limit must be a number`;
        } else if (input.ACTIVE_LIMIT < 0) {
            validatorError["ACTIVE_LIMIT"] = `Download limit must be a positive number`;
        }
        if (!input.AUTH_USERNAME){
            validatorError["AUTH_USERNAME"] = "Please provide a Username";
        }
        if (!input.AUTH_PASSWORD){
            validatorError["AUTH_PASSWORD"] = "Please provide a Password";
        }
        if (!this.matchesRegex(input.REFRESH_SCHEDULE, cronRegex)){
            validatorError["REFRESH_SCHEDULE"] = "Please provide a valid cron expression";
        }
        if (!this.compilesSuccessfully(input.TV_FILENAME_TEMPLATE)){
            validatorError["TV_FILENAME_TEMPLATE"] = "Template does not compile";
        }
        if (!this.compilesSuccessfully(input.MOVIE_FILENAME_TEMPLATE)){
            validatorError["MOVIE_FILENAME_TEMPLATE"] = "Template does not compile";
        }
        return validatorError;
    }

    compilesSuccessfully(template : string) : Boolean {
        try {
            const hbTemplate = Handlebars.compile(template, {strict : true});
            const dummyContext : FilenameTemplateContext = {
                title : "title",
                season : "01",
                episode : "01",
                quality : "720p"
            }
            hbTemplate(dummyContext);
            return true;
        } catch {
            return false;
        }
    }
}