export class CommentRowViewDto {
        public id: number;
        public content: string;
        public createdAt: Date;
        userId: number;
        userLogin: string;
        likesCount: number;
        dislikesCount: number;
        myStatus: string | null
}

