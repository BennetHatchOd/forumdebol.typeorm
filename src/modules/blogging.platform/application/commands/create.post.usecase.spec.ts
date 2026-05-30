// import { Post } from '@modules/blogging.platform/domain/post.domain';
// import {
//     CreatePostCommand,
//     CreatePostHandler,
// } from '@modules/blogging.platform/application/commands/create.post.usecase';
//
// describe('CreatePostHandler', () => {
//     let handler: CreatePostHandler;
//     let postRepository: { savePost: jest.Mock };
//     let blogQueryRepository: { findByIdWithCheck: jest.Mock };
//
//     beforeEach(() => {
//         postRepository = {
//             savePost: jest.fn().mockResolvedValue(undefined),
//         };
//
//         blogQueryRepository = {
//             findByIdWithCheck: jest.fn().mockResolvedValue({ id: '2457' }),
//         };
//
//         handler = new CreatePostHandler(
//             postRepository as any,
//             blogQueryRepository as any,
//         );
//     });
//
//     afterEach(() => {
//         jest.restoreAllMocks();
//     });
//
//     it('should check that blog exists before creating a post', async () => {
//         const inputDto = {
//             title: 'Post title',
//             shortDescription: 'Short description',
//             content: 'Post content',
//             blogId: '7676',
//         };
//
//         const createInstanceSpy = jest
//             .spyOn(Post, 'createInstance')
//             .mockReturnValue({ id: '45524' } as Post);
//
//         const result = await handler.execute(new CreatePostCommand(inputDto as any));
//
//         expect(blogQueryRepository.findByIdWithCheck).toHaveBeenCalledWith('blog-1');
//         expect(createInstanceSpy).toHaveBeenCalledWith(inputDto);
//         expect(postRepository.savePost).toHaveBeenCalledWith(
//             expect.objectContaining({ id: 'post-123' }),
//         );
//         expect(result).toBe('post-123');
//     });
//
//     it('should propagate error if blog does not exist', async () => {
//         const inputDto = {
//             title: 'Post title',
//             shortDescription: 'Short description',
//             content: 'Post content',
//             blogId: 'missing-blog',
//         };
//
//         blogQueryRepository.findByIdWithCheck.mockRejectedValue(
//             new Error('Blog not found'),
//         );
//         const createInstanceSpy = jest.spyOn(Post, 'createInstance');
//
//         await expect(
//             handler.execute(new CreatePostCommand(inputDto as any)),
//         ).rejects.toThrow('Blog not found');
//
//         expect(createInstanceSpy).not.toHaveBeenCalled();
//         expect(postRepository.savePost).not.toHaveBeenCalled();
//     });
//
//     it('should propagate error if repository save fails', async () => {
//         const inputDto = {
//             title: 'Post title',
//             shortDescription: 'Short description',
//             content: 'Post content',
//             blogId: 'blog-1',
//         };
//
//         jest.spyOn(Post, 'createInstance').mockReturnValue({ id: '999' } as Post);
//         postRepository.savePost.mockRejectedValue(new Error('Database error'));
//
//         await expect(
//             handler.execute(new CreatePostCommand(inputDto as any)),
//         ).rejects.toThrow('Database error');
//
//         expect(blogQueryRepository.findByIdWithCheck).toHaveBeenCalledWith('blog-1');
//         expect(postRepository.savePost).toHaveBeenCalled();
//     });
// });