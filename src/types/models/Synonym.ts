import { Entity } from 'src/types/models/Entity'

export interface Synonym extends Entity {
    from : string
    target : string
    filenameOverride? : string
    exemptions : string
}