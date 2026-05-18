
// export function compareArr(arr1: Array<string>, arr2: Array<SessionViewType>){
//     let deviceNamesSource: Array<SessionViewType> = arr2
//     let deviceNames = deviceNamesSource.map(s => s.title)
//     const check = arr1.reduce((acc, current)=>{acc += deviceNames.includes(current)
//                                                         ? 1
//                                                         : 0;
//                                                     return acc }, 0)
//     return check
//         }

import { Rating } from '@modules/blogging.platform/dto/enum/rating.enum';
import { LikesInfoViewDto } from '@modules/blogging.platform/dto/view/likes.info.view.dto';
import { URL_PATH } from '@core/url.path.setting';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { join } from 'path';
import request from 'supertest';

export async function setCheckLikeComment(
    app: INestApplication,
    targetId: string,
    accessToken: string,
    likeStatus: Rating,
): Promise<LikesInfoViewDto>{

    const response = await request(app.getHttpServer())
        .put(join(URL_PATH.comments, targetId, 'like-status'))
        .set("Authorization", 'Bearer ' + accessToken)
        .send({likeStatus: likeStatus })
        .expect(HttpStatus.NO_CONTENT);

    let entityResponse = await request(app.getHttpServer())
                                .get(join(URL_PATH.comments, targetId))
                                .set("Authorization", 'Bearer ' + accessToken)
                                .expect(HttpStatus.OK);

    return entityResponse.body.likesInfo
    
    // return entityResponse.body.extendedLikesInfo
}
