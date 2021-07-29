import { v4 as uuidv4 } from 'uuid';

export default class ActorId {
    id: string;

    constructor(id: string) {
        this.id = id;
    }

    createRandomId(): ActorId {
        return new ActorId(uuidv4());
    }
}