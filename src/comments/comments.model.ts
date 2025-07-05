import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { CreateReplayDto } from './dtos/create-replay-dto';

export interface Comment {
  id?: number;
  user_id: number;
  video_id: number;
  content: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
}

@Injectable()
export class CommentModel {
  constructor(private dbService: DatabaseService) {}

  async createComment(
    comment: CreateCommentDto,
    userId: number,
  ): Promise<Comment> {
    const query = `
      INSERT INTO comments (user_id, video_id, content)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [userId, comment.video_id, comment.content];
    const result = await this.dbService.query(query, values);
    return result[0];
  }

  async findCommentsByVideoId(
    videoId: number,
    page: number = 1,
    limit: number,
  ): Promise<{ comments: Comment[]; total: number }> {
    // const mockCommentsData = {
    //   comments: [
    //     {
    //       id: 1,
    //       user: {
    //         id: 1,
    //         name: 'محمد أحمد',
    //         avatar: '/placeholder.svg?height=40&width=40',
    //       },
    //       content: 'شرح ممتاز ومفصل! استفدت كثيراً من هذا الفيديو',
    //       createdAt: '2025-01-01T10:30:00Z',
    //       replies: [
    //         {
    //           id: 101,
    //           user: {
    //             id: 2,
    //             name: 'سارة محمود',
    //             avatar: '/placeholder.svg?height=40&width=40',
    //           },
    //           content: 'أتفق معك تماماً، الدكتور يشرح بطريقة واضحة جداً',
    //           createdAt: '2025-01-01T11:00:00Z',
    //         },
    //       ],
    //     },
    //     {
    //       id: 2,
    //       user: {
    //         id: 3,
    //         name: 'عمر حسن',
    //         avatar: '/placeholder.svg?height=40&width=40',
    //       },
    //       content: 'هل يمكن توضيح المزيد عن الصمام الأورطي؟',
    //       createdAt: '2025-01-01T14:20:00Z',
    //       replies: [],
    //     },
    //     {
    //       id: 3,
    //       user: {
    //         id: 4,
    //         name: 'فاطمة علي',
    //         avatar: '/placeholder.svg?height=40&width=40',
    //       },
    //       content: 'الرسوم التوضيحية مفيدة جداً، شكراً لكم',
    //       createdAt: '2025-01-01T16:45:00Z',
    //       replies: [
    //         {
    //           id: 102,
    //           user: {
    //             id: 5,
    //             name: 'أحمد سالم',
    //             avatar: '/placeholder.svg?height=40&width=40',
    //           },
    //           content: 'نعم، الرسوم تساعد في فهم التشريح بشكل أفضل',
    //           createdAt: '2025-01-01T17:00:00Z',
    //         },
    //         {
    //           id: 103,
    //           user: {
    //             id: 6,
    //             name: 'مريم خالد',
    //             avatar: '/placeholder.svg?height=40&width=40',
    //           },
    //           content: 'أتمنى المزيد من هذه الفيديوهات التفاعلية',
    //           createdAt: '2025-01-01T17:30:00Z',
    //         },
    //       ],
    //     },
    //   ],
    //   pagination: {
    //     currentPage: 1,
    //     totalPages: 3,
    //     totalComments: 25,
    //     hasNextPage: true,
    //     hasPreviousPage: false,
    //   },
    // };
    const offset = (page - 1) * limit;

    // Query to get the total number of comments
    const totalQuery = 'SELECT COUNT(*) FROM comments WHERE video_id = $1;';
    const totalResult = await this.dbService.query(totalQuery, [videoId]);
    const total = parseInt(totalResult[0].count, 10);

    // Main query to fetch comments with aggregated replies
    const query = `
    SELECT 
      c.id,
      c.content,
      c.created_at AS createdAt,
      c.video_id AS videoId,
      c.user_id AS userId,
      u.name,
      COALESCE((
        SELECT json_agg(
          json_build_object(
            'id', cr.id,
            'user', json_build_object(
              'id', u2.id,
              'name', u2.name
            ),
            'content', cr.content,
            'createdAt', cr.created_at
          ) ORDER BY cr.created_at ASC
        )
        FROM comment_replies cr
        LEFT JOIN users u2 ON cr.user_id = u2.id
        WHERE cr.comment_id = c.id
      ), '[]'::json) AS replies
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.video_id = $1
    ORDER BY c.created_at DESC
    LIMIT $2 OFFSET $3;
`;
    const result = await this.dbService.query(query, [videoId, limit, offset]);

    // Transform the result to match the expected Comment interface
    const comments = result.map((row: any) => ({
      id: row.id,
      user: {
        id: row.userid,
        name: row.name,
      },
      content: row.content,
      createdAt: row.createdat,
      replies: row.replies,
    }));

    return {
      comments,
      total,
    };
  }

  async findCommentByUserId(id: number): Promise<Comment | null> {
    const query = `
      SELECT c.*, u.name, v.title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN videos v ON c.video_id = v.id
      WHERE c.user_id = $1;
    `;
    const result = await this.dbService.query(query, [id]);
    return result;
  }

  async findCommentById(id: number): Promise<Comment | null> {
    const query = `
      SELECT c.*, u.name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1;
    `;
    const result = await this.dbService.query(query, [id]);
    return result[0] || null;
  }

  async updateComment(
    id: number,
    updates: Partial<Comment>,
  ): Promise<Comment | null> {
    const fields = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = Object.values(updates);
    const query = `
      UPDATE comments
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
      RETURNING *;
    `;
    const result = await this.dbService.query(query, [...values, id]);
    return result[0] || null;
  }

  async deleteComment(id: number): Promise<void> {
    const query = 'DELETE FROM comments WHERE id = $1;';
    await this.dbService.query(query, [id]);
  }

  async validateVideoId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM videos WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result.length > 0;
  }

  async validateUserId(id: number): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE id = $1;';
    const result = await this.dbService.query(query, [id]);
    return result.length > 0;
  }

  async replyToComment(
    id: number,
    dto: CreateReplayDto,
    userId: number,
  ): Promise<Comment | null> {
    const updatedComment = await this.dbService.query(
      `
        INSERT INTO comment_replies (comment_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING *;
      `,
      [id, userId, dto.content],
    );
    return updatedComment[0];
  }
}
