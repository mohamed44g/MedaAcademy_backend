import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { Public } from '../decorators/routes.decorator';
import { Roles } from '../decorators/user.role.decoratros';
import { Role, IPayload } from '../utils/types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { response } from '../utils/response';
import { userPayload } from '../decorators/user.decorators';
import { CreateReplayDto } from './dtos/create-replay-dto';

@ApiTags('Comments')
@Controller('/comments')
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Create a new comment on a video' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async createComment(
    @Body() dto: CreateCommentDto,
    @userPayload() userData: IPayload,
  ) {
    const comment = await this.commentService.createComment(dto, userData.id);
    return response('Comment created successfully', comment);
  }

  @Roles(Role.user, Role.admin, Role.super_admin)
  @Get('/user')
  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiResponse({ status: 200, description: 'Comment found' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiBearerAuth()
  async findCommentById(@userPayload() userData: IPayload) {
    const comment = await this.commentService.findCommentByUserId(userData.id);
    return response('Comment retrieved successfully', comment);
  }

  @Public()
  @Get(':videoId')
  @ApiOperation({ summary: 'Get all comments for a video' })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async findCommentsByVideoId(
    @Param('videoId', ParseIntPipe) videoId: number,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    const limit = 6;
    const comments = await this.commentService.findCommentsByVideoId(
      videoId,
      page,
      limit,
    );
    return response('Comments retrieved successfully', comments);
  }

  @Patch(':id')
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiBearerAuth()
  async updateComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @userPayload() userData: IPayload,
  ) {
    const comment = await this.commentService.updateComment(
      id,
      dto,
      userData.id,
    );
    return response('Comment updated successfully', comment);
  }

  @Delete(':id')
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiBearerAuth()
  async deleteComment(
    @Param('id', ParseIntPipe) id: number,
    @userPayload() userData: IPayload,
  ) {
    await this.commentService.deleteComment(id, userData.id);
    return response('Comment deleted successfully', null);
  }

  // reply to comment
  @Post(':id/replies')
  @Roles(Role.user, Role.admin, Role.super_admin)
  @ApiOperation({ summary: 'Reply to a comment' })
  @ApiResponse({
    status: 200,
    description: 'Comment replied successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiBearerAuth()
  async replyToComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReplayDto,
    @userPayload() userData: IPayload,
  ) {
    const comment = await this.commentService.replyToComment(
      id,
      dto,
      userData.id,
    );
    return response('Comment replied successfully', comment);
  }
}
