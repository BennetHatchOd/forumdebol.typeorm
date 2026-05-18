import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { LikesInfoViewDto } from '@modules/blogging.platform/dto/view/likes.info.view.dto';
import { URL_PATH } from '@core/url.path.setting';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { join } from 'path';
import request from 'supertest';
import { ExtendedLikesInfoViewDto } from '@modules/blogging.platform/dto/view/extended.likes.info.view.dto';
import console from 'node:console';

export async function setCheckLikePost(
    app: INestApplication,
    targetId: string,
    accessToken: string,
    likeStatus: Rating,
): Promise<ExtendedLikesInfoViewDto>{

    const response = await request(app.getHttpServer())
        .put(join(URL_PATH.posts, targetId, 'like-status'))
        .set("Authorization", 'Bearer ' + accessToken)
        .send({likeStatus: likeStatus })
        .expect(HttpStatus.NO_CONTENT);

    let entityResponce = await request(app.getHttpServer())
                                .get(join(URL_PATH.posts, targetId))
                                .set("Authorization", 'Bearer ' + accessToken)
                                .expect(HttpStatus.OK);

   return entityResponce.body.extendedLikesInfo
}
