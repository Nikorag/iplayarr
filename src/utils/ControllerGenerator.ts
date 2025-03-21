import fs from 'fs';
import path from 'path';

import { Service, ServiceLibrary } from '../shared/ServiceLibrary';
import { capitalize } from './Utils';

function generateControllerContent({ name, model, dependency, apiTag }: Service): string {
  if (model) {
    const controllerName = `${capitalize(name)}Controller`;
    return `
import { Security, Controller, Get, Post, Put, Delete, Route, Tags, Body, Path } from "tsoa";
${dependency ? `import { ${dependency.importFrom} } from "../../types/models/${dependency.from}";` : ''}
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
}`} else {
    return '';
  }
}

const controllersDir = path.resolve(process.cwd(), 'src/controllers/generated');
if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir, { recursive: true });



for (const service of ServiceLibrary) {
  if (service.model) {
    const controllerName = `${capitalize(service.name)}Controller`;
    const controllerContent = generateControllerContent(service);
    const filePath = path.join(controllersDir, `${controllerName}.ts`);
    fs.writeFileSync(filePath, controllerContent)
  }
}
