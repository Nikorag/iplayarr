import { AbstractStoredType } from './AbstractStoredType'

export interface Synonym extends AbstractStoredType {
    from : string
    target : string
    filenameOverride? : string
    exemptions : string
}