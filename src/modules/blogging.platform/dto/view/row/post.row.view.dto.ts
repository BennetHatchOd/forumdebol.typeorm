export class PostRowViewDto {
    id: number;
    title: string;
    shortDescription: string;
    content: string;
    createdAt: Date;
    deletedAt: Date;
    blogId: number;
    blogName: string;
    likesCount: number
    dislikesCount: number;
    myStatus: string | null;
}
