import { toCamelCase } from './SharedUtils';
import swaggerDef from './tsoa/swagger.json';

// The expectation is that these services provide GET, POST, PUT and DELETE

export interface Service {
    name: string,
    path: string,
    microservices?: {
        [key: string]: ('POST' | 'PUT' | 'GET' | 'DELETE')[]
    },
    initial?: any
}



export const getServiceLibrary = () => {
    const ServiceLibrary: Service[] = [
        {
            name: 'hiddenSettings',
            path: '/config/hiddenSettings',
            initial: {}
        },
        {
            name: 'queue',
            path: '/queue/queue'
        },
    ];
    
    // Iterate over paths in the Swagger definition
    for (const [path, methods] of Object.entries(swaggerDef.paths)) {
        // Iterate over HTTP methods (GET, POST, PUT, DELETE)
        for (const [method, details] of Object.entries(methods)) {
            // Extract tags from the current method
            const tags = details.tags || [];
    
            // Iterate over the tags to create services based on the tag
            tags.forEach((tag: string) => {
                const name = toCamelCase(tag);
                let service = ServiceLibrary.find((service) => service.name === name);
    
                if (!service) {
                    // If no service exists with the tag name, create one
                    service = {
                        name,
                        path: `/${tag}`, // You can adjust the path structure here if necessary
                        microservices: {}
                    };
                    ServiceLibrary.push(service);
                }
    
                // Add the HTTP method to the corresponding microservice path
                if (!service.microservices) {
                    service.microservices = {};
                }
    
                const correctedPath = path.replace(/\/json-api/g, '');
    
                if (!service.microservices![correctedPath]) {
                    service.microservices![correctedPath] = [];
                }
    
                const httpMethod = method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE';
                // Add the HTTP method to the microservice path
                service.microservices![correctedPath].push(httpMethod);
            });
        }
    }
    
    // Now fix the services by removing the basic CRUD operations
    for (const service of ServiceLibrary) {
        const { microservices } = service;
    
        // Find the key with the shortest number of subdirectories
        if (microservices) {
            const keys = Object.keys(microservices);
            let shortestKey = keys[0];
            let shortestLength = shortestKey.split('/').length;
    
            for (const key of keys) {
                const length = key.split('/').length;
                if (length < shortestLength) {
                    shortestKey = key;
                    shortestLength = length;
                }
            }
    
            delete microservices[shortestKey];
            if (microservices[`${shortestKey}/{id}`]) {
                delete microservices[`${shortestKey}/{id}`];
            }
            service.path = shortestKey;
    
            //Now we know the shortest key, we'll remove it from the rest
            const keysToDelete = [];
            for (const key of keys) {
                if (key !== shortestKey && key.startsWith(shortestKey)) {
                    microservices[key.replace(shortestKey, '')] = microservices[key];
                    keysToDelete.push(key);
                }
            }
            for (const key of keysToDelete) {
                delete microservices[key];
            }
        }
    }

    return ServiceLibrary;
}