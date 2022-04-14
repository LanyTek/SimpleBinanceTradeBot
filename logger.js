var winston = require('winston');
const { format } = winston;
const { combine, timestamp, printf } = format;

const myFormat = printf(({ message, timestamp }) => {
  return `[${timestamp}]: ${message}`;
});

winston.loggers.add('error_log', {
  format: combine(
    timestamp(),    
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

winston.loggers.add('debug_log', {
  format: combine(    
    timestamp(),    
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'debug.log', level: 'debug' })
  ]
});

winston.loggers.add('info_log', {
  format: combine(    
    timestamp(),    
    myFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'info.log', level: 'info' })
  ]
});

function error_log(message) {
    winston.loggers.get('error_log').log('error', message);
}

function debug_log(message) {
    winston.loggers.get('debug_log').log('debug', message);
}

function info_log(label, message) {
    winston.loggers.get('info_log').log('info', '[' + label + ']: ' + message);
}

module.exports = {    
    error_log,
    debug_log,
    info_log
}
 
