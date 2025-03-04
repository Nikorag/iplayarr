import { IplayarrParameter } from "../types/IplayarrParameters";
import { getParameter } from "./configService";
import socketService from "./socketService";

const loggingService = {
    log: (...params : any[]) => {
        console.log(...params);
        const message = JSON.stringify(params);
        socketService.emit('log', {id: 'SYSTEM', message, timestamp : new Date()});
    },

    error: (...params : any[]) => {
        console.error(params);
        const message = JSON.stringify(params);
        socketService.emit('log', {id: 'SYSTEM-ERROR', message, timestamp : new Date()});
    },

    debug: (...params : any[]) => {
        getParameter(IplayarrParameter.DEBUG).then((debug) => {
            const message = JSON.stringify(params);
            if (debug && debug.toLowerCase() == 'true'){
                console.log(...params);
                socketService.emit('log', {id: 'SYSTEM-DEBUG', message, timestamp : new Date()});
            }
        });
    },
}

export default loggingService;