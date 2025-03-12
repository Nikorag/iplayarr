import { IplayarrParameter } from '../types/IplayarrParameters';
import { LogLine, LogLineLevel } from '../types/LogLine';
import configService from './configService';
import socketService from './socketService';

const loggingService = {
    log: (...params : any[]) => {
        console.log(...params);
        const message = joinOrReturn(params);
        const logLine : LogLine = {level : LogLineLevel.INFO, id: 'INFO', message, timestamp : new Date()}
        socketService.emit('log', logLine);
    },

    error: (...params : any[]) => {
        console.error(params);
        const message = joinOrReturn(params);
        const logLine : LogLine = {level : LogLineLevel.ERROR, id: 'ERROR', message, timestamp : new Date()};
        socketService.emit('log', logLine);
    },

    debug: (...params : any[]) => {
        configService.getParameter(IplayarrParameter.DEBUG).then((debug) => {
            const message = joinOrReturn(params);
            if (debug && debug.toLowerCase() == 'true'){
                console.log(...params);
                const logLine : LogLine = {level : LogLineLevel.DEBUG, id: 'DEBUG', message, timestamp : new Date()};
                socketService.emit('log', logLine);
            }
        });
    },
}

function joinOrReturn(input : string | any[]) : string {
    if (Array.isArray(input)) {
      return input.map((item : any) => {
        if (typeof item === 'string'){
            return item;
        } else {
            return JSON.stringify(item, null, 2);
        }
      }).join(' ');
    } else if (typeof input === 'string') {
      return input;
    }
    return '';
  }

export default loggingService;
