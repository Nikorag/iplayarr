import { Entity } from './Entity'

export interface Synonym extends Entity {
    from : string
    target : string
    filenameOverride? : string
    exemptions : string
}