import fs from 'fs';
import path from 'path';

import { Parameter,Service, ServiceLibrary } from '../shared/ServiceLibrary';
import { capitalize } from './Utils';

function generateControllerContent(service: Service): string {
    const { name, model, dependency, apiTag } = service;
    if (model) {
        const controllerName = `${capitalize(name, false)}Controller`;
        return `
import { Security, Controller, Get, Post, Put, Delete, Route, Tags, Body, Path } from "tsoa";
${getImports(service)}
import { ApiResponse, ApiError } from "../../types/responses/ApiResponse";

@Route("api/${name}")
@Tags("${apiTag ?? `${model}s`}")
export class ${controllerName} extends Controller {
  
  @Get("/")
  @Security("api_key")
  public async getAll(): Promise<${dependency?.importFrom ?? model}[]> {
    return [];
  }

  @Post("/")
  @Security("api_key")
  public async create(@Body() item: ${dependency?.importFrom ?? model}): Promise<${dependency?.importFrom ?? model}> {
    return item;
  }

  @Put("/")
  @Security("api_key")
  public async update(@Body() item: ${dependency?.importFrom ?? model}): Promise<${dependency?.importFrom ?? model}> {
    return item;
  }

  @Delete("/")
  @Security("api_key")  
  public async delete(@Body() id: string): Promise<boolean> {
    return true;
  }

  ${generateMicroservices(service)}
}`} else {
        return '';
    }
}

const controllersDir = path.resolve(process.cwd(), 'src/controllers/generated');
if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir, { recursive: true });



for (const service of ServiceLibrary) {
    if (service.model) {
        const controllerName = `${capitalize(service.name, false)}Controller`;
        const controllerContent = generateControllerContent(service);
        const filePath = path.join(controllersDir, `${controllerName}.ts`);
        fs.writeFileSync(filePath, controllerContent)
    }
}

function getImports({dependency, microservices} : Service) : string {
    let imports = '';
    if (dependency){
        imports += `import { ${dependency.importFrom} } from "../../types/models/${dependency.from}";\n`;
    }
    if (microservices){
        for (const {dependencies} of microservices){
            if (dependencies){
                for (const {importFrom, from} of dependencies){
                    imports += `import { ${importFrom} } from "../../types/models/${from}";\n`;
                }
            }
        }
    }
    return imports;
}

function generateMicroservices({microservices} : Service) : string {
    let microservicesContent = '';
    if (microservices){
        for (const {method, path, body, result, params, query, name} of microservices){
            microservicesContent += `
            @${method}("${path}")
            @Security("api_key") 
            public async ${name}(${createArguments(body, params, query)}): Promise<${result}> {
                return ${result.endsWith('[]') ? '[]' : '{}'} as ${result};
            }`
        }
    }
    return microservicesContent;
}

function createArguments(body : string | undefined, params : Parameter[] | undefined, query : Parameter[] | undefined) : string{
    const args = [];
    if (body){
        args.push(`@Body() ${body} : ${body}`);
    }
    if (params){
        for (const {name, type} of params){
            args.push(`@Path() ${name} : ${type}`);
        }
    }
    if (query){
        for (const {name, type} of query){
            args.push(`@Query() ${name} : ${type}`);
        }
    }
    return args.join(', ');
}