import { Request, Response } from 'express'

export default (_ : Request, res : Response) => {
    res.json({
        'version' : '1.0.0'
    })
}