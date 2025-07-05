import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentModel, Comment } from './comments.model';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { CreateReplayDto } from './dtos/create-replay-dto';

@Injectable()
export class CommentService {
  constructor(private commentModel: CommentModel) {}

  async createComment(dto: CreateCommentDto, userId: number): Promise<Comment> {
    const videoExists = await this.commentModel.validateVideoId(dto.video_id);
    if (!videoExists) {
      throw new BadRequestException('Invalid video ID');
    }

    const userExists = await this.commentModel.validateUserId(userId);
    if (!userExists) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.commentModel.createComment(dto, userId);
  }

  async findCommentsByVideoId(
    videoId: number,
    page: number = 1,
    limit: number,
  ): Promise<{ comments: Comment[]; total: number }> {
    const videoExists = await this.commentModel.validateVideoId(videoId);
    if (!videoExists) {
      throw new NotFoundException('Video not found');
    }
    return this.commentModel.findCommentsByVideoId(videoId, page, limit);
  }

  async findCommentByUserId(id: number): Promise<Comment> {
    const comment = await this.commentModel.findCommentByUserId(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    return comment;
  }

  async updateComment(
    id: number,
    dto: UpdateCommentDto,
    userId: number,
  ): Promise<Comment | null> {
    const comment = await this.commentModel.findCommentById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.commentModel.updateComment(id, dto);
    return updatedComment;
  }

  async deleteComment(id: number, userId: number): Promise<void> {
    const comment = await this.commentModel.findCommentById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (userId !== 0 && comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentModel.deleteComment(id);
  }
  

  async replyToComment(
    id: number,
    dto: CreateReplayDto,
    userId: number,
  ): Promise<Comment | null> {
    const comment = await this.commentModel.findCommentById(id);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const updatedComment = await this.commentModel.replyToComment(
      id,
      dto,
      userId,
    );
    return updatedComment;
  }
}
