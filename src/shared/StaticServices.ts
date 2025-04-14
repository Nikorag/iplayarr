import { Service } from './ServiceLibrary';

export const StaticServices : Service[] = [
    {
        name: 'auth',
        path: 'auth',
        microservices : {
            '/login' : ['POST'],
            '/logout' : ['POST'],
            '/generateToken' : ['POST'],
            '/resetPassword' : ['POST']
        },
        crud : false
    }   
]