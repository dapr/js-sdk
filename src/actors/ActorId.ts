import { v4 as uuidv4 } from 'uuid';

export default class ActorId {
    private readonly id: string;

    constructor(id: string) {
        this.id = id;
    }

    createRandomId(): ActorId {
        return new ActorId(uuidv4());
    }
    
    getId() {
        return this.id;
    }
}