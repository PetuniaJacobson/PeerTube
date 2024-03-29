import { ResultList, VideoCommentThreadTree } from '@peertube/peertube-models'
import { logger } from '@server/helpers/logger.js'
import { sequelizeTypescript } from '@server/initializers/database.js'
import express from 'express'
import cloneDeep from 'lodash-es/cloneDeep.js'
import * as Sequelize from 'sequelize'
import { VideoCommentModel } from '../models/video/video-comment.js'
import {
  MAccountDefault,
  MComment,
  MCommentFormattable,
  MCommentOwnerVideo,
  MCommentOwnerVideoReply,
  MVideoFullLight
} from '../types/models/index.js'
import { sendCreateVideoComment, sendDeleteVideoComment } from './activitypub/send/index.js'
import { getLocalVideoCommentActivityPubUrl } from './activitypub/url.js'
import { Hooks } from './plugins/hooks.js'

async function removeComment (commentArg: MComment, req: express.Request, res: express.Response) {
  let videoCommentInstanceBefore: MCommentOwnerVideo

  await sequelizeTypescript.transaction(async t => {
    const comment = await VideoCommentModel.loadByUrlAndPopulateAccountAndVideo(commentArg.url, t)

    videoCommentInstanceBefore = cloneDeep(comment)

    if (comment.isOwned() || comment.Video.isOwned()) {
      await sendDeleteVideoComment(comment, t)
    }

    comment.markAsDeleted()

    await comment.save({ transaction: t })

    logger.info('Video comment %d deleted.', comment.id)
  })

  Hooks.runAction('action:api.video-comment.deleted', { comment: videoCommentInstanceBefore, req, res })
}

async function createVideoComment (obj: {
  text: string
  inReplyToComment: MComment | null
  video: MVideoFullLight
  account: MAccountDefault
}, t: Sequelize.Transaction) {
  let originCommentId: number | null = null
  let inReplyToCommentId: number | null = null

  if (obj.inReplyToComment && obj.inReplyToComment !== null) {
    originCommentId = obj.inReplyToComment.originCommentId || obj.inReplyToComment.id
    inReplyToCommentId = obj.inReplyToComment.id
  }

  const comment = await VideoCommentModel.create({
    text: obj.text,
    originCommentId,
    inReplyToCommentId,
    videoId: obj.video.id,
    accountId: obj.account.id,
    url: new Date().toISOString()
  }, { transaction: t, validate: false })

  comment.url = getLocalVideoCommentActivityPubUrl(obj.video, comment)

  const savedComment: MCommentOwnerVideoReply = await comment.save({ transaction: t })
  savedComment.InReplyToVideoComment = obj.inReplyToComment
  savedComment.Video = obj.video
  savedComment.Account = obj.account

  await sendCreateVideoComment(savedComment, t)

  return savedComment
}

function buildFormattedCommentTree (resultList: ResultList<MCommentFormattable>): VideoCommentThreadTree {
  // Comments are sorted by id ASC
  const comments = resultList.data

  const comment = comments.shift()
  const thread: VideoCommentThreadTree = {
    comment: comment.toFormattedJSON(),
    children: []
  }
  const idx = {
    [comment.id]: thread
  }

  while (comments.length !== 0) {
    const childComment = comments.shift()

    const childCommentThread: VideoCommentThreadTree = {
      comment: childComment.toFormattedJSON(),
      children: []
    }

    const parentCommentThread = idx[childComment.inReplyToCommentId]
    // Maybe the parent comment was blocked by the admin/user
    if (!parentCommentThread) continue

    parentCommentThread.children.push(childCommentThread)
    idx[childComment.id] = childCommentThread
  }

  return thread
}

// ---------------------------------------------------------------------------

export {
  removeComment,
  createVideoComment,
  buildFormattedCommentTree
}
