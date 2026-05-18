export class CreateCommentDto{
    constructor(
        public postId: string,
        public content: string,
        public userId: string,
    ){}
}