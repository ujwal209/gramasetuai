from fastapi import APIRouter, HTTPException, Query, Depends, Body, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import uuid
import re
import asyncio
import logging

from app.core.config import settings
from app.database.mongodb import get_mongo_db, get_database
from app.services.email_service import email_service

logger = logging.getLogger("gramsetu.chaupal")

router = APIRouter()

# -------------------------------------------------------------
# HELPER: GRAMSETU OFFICIAL SEEDING (NO EMOJIS, CLEAN MARKETING)
# -------------------------------------------------------------
async def ensure_official_gramsetu_content(db):
    if db is None:
        return
    try:
        count = await db["chaupal_posts"].count_documents({"author.username": "gramsetu_official"})
        if count == 0:
            now = datetime.utcnow()
            official_posts = [
                {
                    "id": "post_official_pmkisan",
                    "author": {
                        "user_id": "gramsetu_gov",
                        "name": "GramSetu Official",
                        "username": "gramsetu_official",
                        "avatar_url": "/logo.png",
                        "village": "National Civic Network",
                        "is_verified": True,
                        "is_official": True,
                        "badge": "Official Platform"
                    },
                    "media_urls": [
                        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1200&auto=format&fit=crop&q=80"
                    ],
                    "media_type": "image",
                    "caption": "STATUTORY ADVISORY: PM-KISAN 17th Installment Direct Benefit Transfer (DBT) has been disbursed to eligible bank accounts. Ensure your e-KYC and Aadhaar-NPCI bank account seeding are active on GramSetu Scheme Advisor.",
                    "crop_tag": "Govt Advisory",
                    "location": "New Delhi, India",
                    "hashtags": ["#PMKISAN", "#DBTTransfer", "#GovtAdvisory", "#GramSetu"],
                    "likes_count": 34,
                    "likes_users": [],
                    "comments": [],
                    "created_at": (now - timedelta(hours=6)).isoformat()
                },
                {
                    "id": "post_official_pmkusum",
                    "author": {
                        "user_id": "gramsetu_gov",
                        "name": "GramSetu Official",
                        "username": "gramsetu_official",
                        "avatar_url": "/logo.png",
                        "village": "National Civic Network",
                        "is_verified": True,
                        "is_official": True,
                        "badge": "Official Platform"
                    },
                    "media_urls": [
                        "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&auto=format&fit=crop&q=80"
                    ],
                    "media_type": "image",
                    "caption": "PM-KUSUM Component B: 90% Subsidy available on Standalone Solar Agriculture Pumps (3HP to 7.5HP). Eliminate diesel costs and get zero electricity bill farming with daytime irrigation.",
                    "crop_tag": "PM-KUSUM Solar",
                    "location": "National Portal",
                    "hashtags": ["#PMKUSUM_SolarPumps", "#SolarIrrigation", "#GreenEnergy", "#FarmTech"],
                    "likes_count": 52,
                    "likes_users": [],
                    "comments": [],
                    "created_at": (now - timedelta(hours=14)).isoformat()
                }
            ]
            await db["chaupal_posts"].insert_many(official_posts)

        s_count = await db["chaupal_stories"].count_documents({"username": "gramsetu_official"})
        if s_count == 0:
            now = datetime.utcnow()
            await db["chaupal_stories"].insert_one({
                "id": "story_official_1",
                "user_id": "gramsetu_gov",
                "username": "gramsetu_official",
                "name": "GramSetu Official",
                "avatar_url": "/logo.png",
                "village": "Official Civic Desk",
                "is_official": True,
                "is_verified": True,
                "media_url": "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=1080&auto=format&fit=crop&q=80",
                "media_type": "image",
                "caption": "PM-KISAN and PM-KUSUM Solar Subsidies are now active. Check your eligibility.",
                "created_at": now.isoformat(),
                "expires_at": (now + timedelta(hours=48)).isoformat(),
                "views_count": 120
            })
    except Exception as e:
        logger.warning(f"Error checking official seed content: {e}")


def normalize_handle(handle: Optional[str]) -> str:
    if not handle:
        return "citizen_farmer"
    cleaned = str(handle).strip().lstrip("@").lower()
    return cleaned if cleaned else "citizen_farmer"


def get_frontend_base_url() -> str:
    env_url = os.getenv("FRONTEND_URL", "").strip()
    if env_url:
        return env_url.rstrip("/")
    if hasattr(settings, "FRONTEND_URL") and settings.FRONTEND_URL:
        return settings.FRONTEND_URL.rstrip("/")
    return "https://gramsetu-ai.vercel.app"


async def create_in_app_notification(
    recipient_handle: str,
    actor_handle: str,
    actor_name: str,
    actor_avatar: str = "/logo.png",
    type: str = "activity",
    text: str = "",
    action_url: str = "/dashboard/chaupal"
):
    clean_recipient = normalize_handle(recipient_handle)
    clean_actor = normalize_handle(actor_handle)
    if not clean_recipient or clean_recipient == clean_actor or clean_recipient in ("gramsetu_official", "gramsetu_gov"):
        return
    try:
        db = get_mongo_db()
        if db is not None:
            notif_doc = {
                "id": f"notif_{uuid.uuid4().hex[:10]}",
                "recipient_handle": clean_recipient,
                "actor_handle": clean_actor,
                "actor_name": actor_name,
                "actor_avatar": actor_avatar or "/logo.png",
                "type": type,
                "text": text,
                "action_url": action_url,
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            }
            await db["chaupal_notifications"].insert_one(notif_doc)
    except Exception as e:
        logger.error(f"Error recording in-app notification: {e}", exc_info=True)


# Helper to dispatch background mail notification
async def trigger_user_email_notification(
    recipient_handle: str,
    event_type: str,
    actor_name: str,
    body_text: str = "",
    action_url: Optional[str] = None
):
    try:
        frontend_base = get_frontend_base_url()
        if not action_url:
            action_url = f"{frontend_base}/dashboard/chaupal"
        elif action_url.startswith("http://localhost:3000"):
            action_url = action_url.replace("http://localhost:3000", frontend_base)

        db = get_mongo_db()
        if db is None:
            return
        user_doc = await db["users"].find_one({
            "$or": [{"handle": recipient_handle}, {"username": recipient_handle}, {"email": recipient_handle}]
        })
        if user_doc and user_doc.get("email"):
            email_addr = user_doc.get("email")
            name = user_doc.get("name", recipient_handle)
            asyncio.create_task(
                email_service.send_chaupal_notification_email(
                    to_email=email_addr,
                    recipient_name=name,
                    event_type=event_type,
                    actor_name=actor_name,
                    body_text=body_text,
                    action_url=action_url
                )
            )
    except Exception as e:
        logger.warning(f"Failed to dispatch email alert: {e}")


# -------------------------------------------------------------
# 1. 24-HOUR EPHEMERAL STORIES
# -------------------------------------------------------------

@router.get("/stories", summary="Get active 24h stories grouped by user")
async def get_stories():
    db = get_mongo_db()
    if db is not None:
        await ensure_official_gramsetu_content(db)

    stories = []
    if db is not None:
        try:
            now_iso = datetime.utcnow().isoformat()
            cursor = db["chaupal_stories"].find({
                "expires_at": {"$gt": now_iso}
            }).sort("created_at", -1)
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                stories.append(doc)
        except Exception as e:
            logger.warning(f"Error reading stories from MongoDB: {e}")

    # Group stories by author username
    grouped: Dict[str, Any] = {}
    for s in stories:
        uname = s.get("username", "farmer")
        if uname not in grouped:
            grouped[uname] = {
                "user_id": s.get("user_id"),
                "username": uname,
                "name": s.get("name"),
                "avatar_url": s.get("avatar_url"),
                "village": s.get("village"),
                "is_official": s.get("is_official", False),
                "is_verified": s.get("is_verified", True),
                "stories": []
            }
        grouped[uname]["stories"].append(s)

    sorted_groups = sorted(
        list(grouped.values()),
        key=lambda g: (0 if g.get("is_official") else 1, g.get("name", ""))
    )

    return {
        "success": True,
        "count": len(stories),
        "users_count": len(sorted_groups),
        "story_groups": sorted_groups
    }


@router.post("/stories", summary="Create a new 24h story")
async def create_story(payload: Dict[str, Any] = Body(...)):
    media_url = payload.get("media_url")
    if not media_url:
        raise HTTPException(status_code=400, detail="Media URL is required for story")

    story_id = f"story_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow()
    story_doc = {
        "id": story_id,
        "user_id": payload.get("user_id", "current_user"),
        "username": payload.get("username", "citizen_farmer"),
        "name": payload.get("name", "Citizen Farmer"),
        "avatar_url": payload.get("avatar_url", "/logo.png"),
        "village": payload.get("village", "India"),
        "media_url": media_url,
        "media_type": payload.get("media_type", "image"),
        "caption": payload.get("caption", ""),
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(hours=24)).isoformat(),
        "views_count": 0
    }

    db = get_mongo_db()
    if db is not None:
        try:
            await db["chaupal_stories"].insert_one(story_doc.copy())
        except Exception as e:
            logger.warning(f"Failed to save story to MongoDB: {e}")

    return {"success": True, "story": story_doc}


@router.delete("/stories/{story_id}", summary="Delete a 24h story")
async def delete_story(
    story_id: str,
    username: Optional[str] = Query(None)
):
    db = get_mongo_db()
    if db is not None:
        try:
            query: Dict[str, Any] = {"id": story_id}
            if username and username != "gramsetu_official":
                query["$or"] = [{"username": username}, {"user_id": username}]
            res = await db["chaupal_stories"].delete_one(query)
            if res.deleted_count > 0:
                return {"success": True, "message": "Story deleted successfully", "id": story_id}
            res2 = await db["chaupal_stories"].delete_one({"id": story_id})
            if res2.deleted_count > 0:
                return {"success": True, "message": "Story deleted successfully", "id": story_id}
        except Exception as e:
            logger.warning(f"Error deleting story {story_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Story not found")


@router.put("/stories/{story_id}", summary="Edit a 24h story caption")
async def update_story(
    story_id: str,
    payload: Dict[str, Any] = Body(...)
):
    caption = payload.get("caption", "").strip()
    db = get_mongo_db()
    if db is not None:
        try:
            update_fields = {"caption": caption, "updated_at": datetime.utcnow().isoformat()}
            if payload.get("media_url"):
                update_fields["media_url"] = payload.get("media_url")
            res = await db["chaupal_stories"].update_one(
                {"id": story_id},
                {"$set": update_fields}
            )
            if res.matched_count > 0:
                story = await db["chaupal_stories"].find_one({"id": story_id})
                if story:
                    story["_id"] = str(story["_id"])
                return {"success": True, "story": story}
        except Exception as e:
            logger.warning(f"Error updating story {story_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Story not found")


@router.post("/stories/{story_id}/reply", summary="Reply directly to a story via direct message with mail alert")
async def reply_to_story(
    story_id: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...)
):
    text = payload.get("text", "").strip()
    sender_handle = payload.get("username", "citizen_farmer")
    sender_name = payload.get("name", "Citizen Farmer")
    sender_avatar = payload.get("avatar_url", "/logo.png")

    if not text:
        raise HTTPException(status_code=400, detail="Reply text is required")

    db = get_mongo_db()
    if db is not None:
        try:
            story = await db["chaupal_stories"].find_one({"id": story_id})
            if story:
                recipient_handle = story.get("username")
                if recipient_handle == "gramsetu_official" or story.get("is_official"):
                    raise HTTPException(status_code=400, detail="Cannot message official broadcast portal")

                msg_doc = {
                    "id": f"msg_{uuid.uuid4().hex[:10]}",
                    "sender_handle": sender_handle,
                    "sender_name": sender_name,
                    "sender_avatar": sender_avatar,
                    "recipient_handle": recipient_handle,
                    "text": f"Replied to your story: {text}",
                    "story_id": story_id,
                    "story_media_url": story.get("media_url"),
                    "created_at": datetime.utcnow().isoformat(),
                    "read": False
                }
                await db["chaupal_direct_messages"].insert_one(msg_doc.copy())

                background_tasks.add_task(
                    create_in_app_notification,
                    recipient_handle=recipient_handle,
                    actor_handle=sender_handle,
                    actor_name=sender_name,
                    actor_avatar=sender_avatar,
                    type="story_reply",
                    text=f'Replied to your 24h story: "{text[:80]}"',
                    action_url=f"/dashboard/chaupal/messages?user={sender_handle}"
                )

                background_tasks.add_task(
                    trigger_user_email_notification,
                    recipient_handle=recipient_handle,
                    event_type="message",
                    actor_name=sender_name,
                    body_text=f"Replied to your 24h story: \"{text}\"",
                    action_url=f"{get_frontend_base_url()}/dashboard/chaupal/messages?user={sender_handle}"
                )

                return {"success": True, "message": "Reply sent to farmer directly", "chat_message": msg_doc}
        except Exception as e:
            logger.warning(f"Error handling story reply: {e}")

    return {"success": True, "message": "Story reply recorded"}


# -------------------------------------------------------------
# 2. FEED & SINGLE POST (WITH NO 404)
# -------------------------------------------------------------

@router.get("/posts", summary="Get Kisan Chaupal feed posts dynamically from database")
async def get_posts(
    tag: Optional[str] = None,
    username: Optional[str] = None,
    limit: int = 30,
    skip: int = 0
):
    db = get_mongo_db()
    if db is not None:
        await ensure_official_gramsetu_content(db)

    posts = []
    if db is not None:
        try:
            query = {}
            if tag and tag.lower() != "all":
                query["$or"] = [
                    {"crop_tag": {"$regex": tag, "$options": "i"}},
                    {"hashtags": {"$regex": tag, "$options": "i"}},
                    {"caption": {"$regex": tag, "$options": "i"}}
                ]
            if username:
                query["author.username"] = username

            cursor = db["chaupal_posts"].find(query).sort("created_at", -1).skip(skip).limit(limit)
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                posts.append(doc)
        except Exception as e:
            logger.warning(f"Error fetching posts from MongoDB: {e}")

    return {
        "success": True,
        "count": len(posts),
        "posts": posts
    }


@router.get("/posts/{post_id}", summary="Get single Kisan Chaupal post details")
async def get_post_by_id(post_id: str):
    db = get_mongo_db()
    if db is not None:
        await ensure_official_gramsetu_content(db)
        try:
            post = await db["chaupal_posts"].find_one({"$or": [{"id": post_id}, {"_id": post_id}]})
            if post:
                post["_id"] = str(post["_id"])
                return {"success": True, "post": post}
        except Exception as e:
            logger.warning(f"Error fetching post {post_id}: {e}")

    raise HTTPException(status_code=404, detail="Post not found")


# -------------------------------------------------------------
# 3. ALGORITHMIC EXPLORE PAGE ENGINE (NO MODAL NEEDED)
# -------------------------------------------------------------

@router.get("/explore", summary="Algorithmic Explore Feed ranked by engagement score")
async def get_explore_feed(
    category: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 40,
    skip: int = 0
):
    db = get_mongo_db()
    if db is not None:
        await ensure_official_gramsetu_content(db)

    posts = []
    if db is not None:
        try:
            filter_q: Dict[str, Any] = {}
            if category and category.lower() != "all" and category.lower() != "trending":
                filter_q["$or"] = [
                    {"crop_tag": {"$regex": category, "$options": "i"}},
                    {"hashtags": {"$regex": category, "$options": "i"}},
                    {"caption": {"$regex": category, "$options": "i"}}
                ]
            if query:
                filter_q["$or"] = [
                    {"caption": {"$regex": query, "$options": "i"}},
                    {"hashtags": {"$regex": query, "$options": "i"}},
                    {"location": {"$regex": query, "$options": "i"}},
                    {"author.name": {"$regex": query, "$options": "i"}}
                ]

            cursor = db["chaupal_posts"].find(filter_q).skip(skip).limit(limit)
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                likes = doc.get("likes_count", 0)
                comments_count = len(doc.get("comments", []))
                is_off = 30 if doc.get("author", {}).get("is_official") else 0
                has_media = 20 if doc.get("media_urls") and len(doc.get("media_urls")) > 0 else 0
                doc["rank_score"] = (likes * 2) + (comments_count * 3) + is_off + has_media
                posts.append(doc)

            posts.sort(key=lambda p: p.get("rank_score", 0), reverse=True)
        except Exception as e:
            logger.warning(f"Error in explore algorithm: {e}")

    return {
        "success": True,
        "count": len(posts),
        "posts": posts
    }


@router.post("/posts", summary="Publish new Kisan Chaupal photo/video post")
async def create_post(payload: Dict[str, Any] = Body(...)):
    caption = payload.get("caption", "").strip()
    media_urls = payload.get("media_urls", [])

    if not caption and not media_urls:
        raise HTTPException(status_code=400, detail="Post must contain a caption or at least one photo")

    post_id = f"post_{uuid.uuid4().hex[:10]}"
    hashtags = re.findall(r"#\w+", caption)
    if not hashtags and payload.get("crop_tag"):
        hashtags = [f"#{payload.get('crop_tag').split()[0]}"]

    post_doc = {
        "id": post_id,
        "author": {
            "user_id": payload.get("user_id", "current_user"),
            "name": payload.get("name", "Citizen Farmer"),
            "username": payload.get("username", "citizen_farmer"),
            "avatar_url": payload.get("avatar_url", "/logo.png"),
            "village": payload.get("village", "Karnataka, India"),
            "is_verified": payload.get("is_verified", False),
            "is_official": payload.get("is_official", False),
            "badge": payload.get("badge", "Farmer")
        },
        "media_urls": media_urls,
        "media_type": payload.get("media_type", "image"),
        "caption": caption,
        "topic": payload.get("topic", "General Agriculture Discussion"),
        "crop_tag": payload.get("crop_tag", "General Agriculture"),
        "farming_stage": payload.get("farming_stage", ""),
        "farming_practice": payload.get("farming_practice", ""),
        "observed_yield": payload.get("observed_yield", ""),
        "location": payload.get("location", "Karnataka, India"),
        "hashtags": hashtags,
        "likes_count": 0,
        "likes_users": [],
        "comments": [],
        "created_at": datetime.utcnow().isoformat()
    }

    db = get_mongo_db()
    if db is not None:
        try:
            await db["chaupal_posts"].insert_one(post_doc.copy())
        except Exception as e:
            logger.warning(f"Error inserting post into MongoDB: {e}")

    return {"success": True, "post": post_doc}


@router.put("/posts/{post_id}", summary="Edit Kisan Chaupal post")
async def update_post(
    post_id: str,
    payload: Dict[str, Any] = Body(...)
):
    caption = payload.get("caption", "").strip()
    hashtags = re.findall(r"#\w+", caption) if caption else []

    update_data: Dict[str, Any] = {
        "updated_at": datetime.utcnow().isoformat()
    }
    if caption:
        update_data["caption"] = caption
        update_data["hashtags"] = hashtags
    if "crop_tag" in payload:
        update_data["crop_tag"] = payload["crop_tag"]
    if "topic" in payload:
        update_data["topic"] = payload["topic"]
    if "location" in payload:
        update_data["location"] = payload["location"]
    if "farming_practice" in payload:
        update_data["farming_practice"] = payload["farming_practice"]
    if "farming_stage" in payload:
        update_data["farming_stage"] = payload["farming_stage"]
    if "observed_yield" in payload:
        update_data["observed_yield"] = payload["observed_yield"]
    if "media_urls" in payload:
        update_data["media_urls"] = payload["media_urls"]

    db = get_mongo_db()
    if db is not None:
        try:
            res = await db["chaupal_posts"].update_one(
                {"$or": [{"id": post_id}, {"_id": post_id}]},
                {"$set": update_data}
            )
            if res.matched_count > 0:
                updated_doc = await db["chaupal_posts"].find_one({"$or": [{"id": post_id}, {"_id": post_id}]})
                if updated_doc:
                    updated_doc["_id"] = str(updated_doc["_id"])
                return {"success": True, "post": updated_doc}
        except Exception as e:
            logger.warning(f"Error updating post {post_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Post not found")


@router.delete("/posts/{post_id}", summary="Delete Kisan Chaupal post")
async def delete_post(
    post_id: str,
    username: Optional[str] = Query(None)
):
    db = get_mongo_db()
    if db is not None:
        try:
            query: Dict[str, Any] = {"$or": [{"id": post_id}, {"_id": post_id}]}
            res = await db["chaupal_posts"].delete_one(query)
            if res.deleted_count > 0:
                return {"success": True, "message": "Post deleted successfully", "id": post_id}
        except Exception as e:
            logger.warning(f"Error deleting post {post_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Post not found")


@router.post("/posts/{post_id}/like", summary="Toggle like with email notification alert")
async def toggle_like(
    post_id: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...)
):
    user_id = payload.get("user_id", "citizen_farmer")
    actor_name = payload.get("name", user_id)
    db = get_mongo_db()

    liked = False
    new_count = 1

    if db is not None:
        try:
            post = await db["chaupal_posts"].find_one({"$or": [{"id": post_id}, {"_id": post_id}]})
            if post:
                likes = post.get("likes_users", [])
                if user_id in likes:
                    likes.remove(user_id)
                    liked = False
                else:
                    likes.append(user_id)
                    liked = True
                    author_handle = post.get("author", {}).get("username")
                    if author_handle and author_handle != user_id and author_handle != "gramsetu_official":
                        background_tasks.add_task(
                            create_in_app_notification,
                            recipient_handle=author_handle,
                            actor_handle=user_id,
                            actor_name=actor_name,
                            actor_avatar=payload.get("avatar_url", "/logo.png"),
                            type="like",
                            text=f'liked your post: "{post.get("caption", "")[:60]}"',
                            action_url=f"/dashboard/chaupal/post/{post_id}"
                        )

                        background_tasks.add_task(
                            trigger_user_email_notification,
                            recipient_handle=author_handle,
                            event_type="like",
                            actor_name=actor_name,
                            body_text=f"Liked your post: \"{post.get('caption', '')[:80]}...\"",
                            action_url=f"{get_frontend_base_url()}/dashboard/chaupal/post/{post_id}"
                        )

                new_count = len(likes)
                await db["chaupal_posts"].update_one(
                    {"$or": [{"id": post_id}, {"_id": post_id}]},
                    {"$set": {"likes_users": likes, "likes_count": new_count}}
                )
        except Exception as e:
            logger.warning(f"Error toggling like: {e}")
    else:
        liked = True

    return {"success": True, "liked": liked, "likes_count": new_count}


@router.post("/posts/{post_id}/comment", summary="Add comment or nested reply with email alert")
async def add_comment(
    post_id: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...)
):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Comment text cannot be empty")

    parent_id = payload.get("parent_comment_id")
    reply_to_username = payload.get("reply_to_username")
    sender_name = payload.get("name", "Citizen Farmer")
    sender_handle = payload.get("username", "citizen_farmer")
    sender_avatar = payload.get("avatar_url", "/logo.png")

    comment = {
        "id": f"c_{uuid.uuid4().hex[:8]}",
        "parent_id": parent_id,
        "reply_to_username": reply_to_username,
        "username": sender_handle,
        "name": sender_name,
        "avatar_url": sender_avatar,
        "text": text,
        "created_at": datetime.utcnow().isoformat()
    }

    db = get_mongo_db()
    if db is not None:
        try:
            post = await db["chaupal_posts"].find_one({"$or": [{"id": post_id}, {"_id": post_id}]})
            await db["chaupal_posts"].update_one(
                {"$or": [{"id": post_id}, {"_id": post_id}]},
                {"$push": {"comments": comment}}
            )

            recipient_handle = reply_to_username if reply_to_username else (post.get("author", {}).get("username") if post else None)
            if recipient_handle and recipient_handle != sender_handle and recipient_handle != "gramsetu_official":
                background_tasks.add_task(
                    create_in_app_notification,
                    recipient_handle=recipient_handle,
                    actor_handle=sender_handle,
                    actor_name=sender_name,
                    actor_avatar=sender_avatar,
                    type="comment",
                    text=f'commented: "{text[:70]}"',
                    action_url=f"/dashboard/chaupal/post/{post_id}"
                )

                background_tasks.add_task(
                    trigger_user_email_notification,
                    recipient_handle=recipient_handle,
                    event_type="comment",
                    actor_name=sender_name,
                    body_text=f"\"{text}\"",
                    action_url=f"{get_frontend_base_url()}/dashboard/chaupal/post/{post_id}"
                )
        except Exception as e:
            logger.warning(f"Error adding comment to MongoDB: {e}")

    return {"success": True, "comment": comment}


# -------------------------------------------------------------
# 4. REAL-TIME DIRECT MESSAGING
# -------------------------------------------------------------

@router.get("/messages/conversations", summary="Get all direct message conversation threads")
async def get_conversations(current_user: str = Query("citizen_farmer")):
    db = get_mongo_db()
    threads: Dict[str, Any] = {}

    if db is not None:
        try:
            cursor = db["chaupal_direct_messages"].find({
                "$or": [
                    {"sender_handle": current_user},
                    {"recipient_handle": current_user}
                ]
            }).sort("created_at", -1)

            async for msg in cursor:
                msg["_id"] = str(msg["_id"])
                other_user = msg["recipient_handle"] if msg["sender_handle"] == current_user else msg["sender_handle"]
                if other_user in ("gramsetu_official", "gramsetu_gov"):
                    continue

                other_name = msg.get("recipient_name") if msg["sender_handle"] == current_user else msg.get("sender_name", other_user)
                other_avatar = msg.get("recipient_avatar") if msg["sender_handle"] == current_user else msg.get("sender_avatar", "/logo.png")

                if other_user not in threads:
                    threads[other_user] = {
                        "other_handle": other_user,
                        "other_name": other_name or other_user.replace("_", " ").title(),
                        "other_avatar": other_avatar,
                        "last_message": msg.get("text", ""),
                        "last_timestamp": msg.get("created_at"),
                        "last_message_time": msg.get("created_at"),
                        "unread_count": 1 if not msg.get("read") and msg["recipient_handle"] == current_user else 0
                    }
        except Exception as e:
            logger.warning(f"Error reading conversations: {e}")

    return {"success": True, "conversations": list(threads.values())}


@router.get("/messages/{other_handle}", summary="Get message chat history with a farmer")
async def get_chat_history(
    other_handle: str,
    current_user: str = Query("citizen_farmer")
):
    db = get_mongo_db()
    messages = []

    if other_handle in ("gramsetu_official", "gramsetu_gov"):
        raise HTTPException(status_code=400, detail="Cannot message official broadcast portal")

    if db is not None:
        try:
            cursor = db["chaupal_direct_messages"].find({
                "$or": [
                    {"sender_handle": current_user, "recipient_handle": other_handle},
                    {"sender_handle": other_handle, "recipient_handle": current_user}
                ]
            }).sort("created_at", 1)

            async for msg in cursor:
                msg["_id"] = str(msg["_id"])
                messages.append(msg)

            await db["chaupal_direct_messages"].update_many(
                {"sender_handle": other_handle, "recipient_handle": current_user, "read": False},
                {"$set": {"read": True}}
            )
        except Exception as e:
            logger.warning(f"Error fetching chat history: {e}")

    return {"success": True, "count": len(messages), "messages": messages}


# In-memory ephemeral typing status map: (recipient_handle, sender_handle) -> timestamp
_typing_status_tracker: Dict[str, float] = {}


@router.get("/messages/users/search", summary="Search registered platform users to start a new chat")
async def search_messageable_users(
    query: str = Query(""),
    current_user: str = Query("citizen_farmer")
):
    db = get_mongo_db()
    users_list = []
    if db is not None:
        try:
            filter_q: Dict[str, Any] = {
                "handle": {"$nin": [current_user, "gramsetu_official", "gramsetu_gov"]}
            }
            if query.strip():
                filter_q["$or"] = [
                    {"name": {"$regex": query.strip(), "$options": "i"}},
                    {"handle": {"$regex": query.strip(), "$options": "i"}},
                    {"village": {"$regex": query.strip(), "$options": "i"}},
                    {"district": {"$regex": query.strip(), "$options": "i"}},
                ]

            cursor = db["users"].find(filter_q).limit(20)
            async for u in cursor:
                h = u.get("handle") or u.get("username")
                if not h or h in (current_user, "gramsetu_official", "gramsetu_gov"):
                    continue
                users_list.append({
                    "username": h,
                    "name": u.get("name") or h.replace("_", " ").title(),
                    "avatar_url": u.get("avatar_url", "/logo.png"),
                    "village": f"{u.get('village', 'Village')}, {u.get('district', 'District')}" if u.get("village") else "Karnataka, India",
                    "is_verified": u.get("is_verified", True)
                })
        except Exception as e:
            logger.warning(f"Error searching messageable users: {e}")

    return {"success": True, "users": users_list}


@router.post("/messages/{other_handle}/typing", summary="Send typing status heartbeat")
async def set_typing_status(
    other_handle: str,
    payload: Dict[str, Any] = Body(...)
):
    sender_handle = payload.get("sender_handle", "citizen_farmer")
    is_typing = payload.get("is_typing", True)

    key = f"{other_handle}:{sender_handle}"
    import time
    if is_typing:
        _typing_status_tracker[key] = time.time()
    else:
        _typing_status_tracker.pop(key, None)

    return {"success": True}


@router.get("/messages/{other_handle}/typing", summary="Check if other user is typing")
async def get_typing_status(
    other_handle: str,
    current_user: str = Query("citizen_farmer")
):
    import time
    key = f"{current_user}:{other_handle}"
    last_time = _typing_status_tracker.get(key, 0)
    is_typing = (time.time() - last_time) < 4.0

    return {"success": True, "is_typing": is_typing}


@router.post("/messages/{other_handle}", summary="Send direct message (text, photo, voice note) with email alert")
async def send_direct_message(
    other_handle: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...)
):
    if other_handle in ("gramsetu_official", "gramsetu_gov"):
        raise HTTPException(status_code=400, detail="Cannot message official broadcast portal")

    text = payload.get("text", "").strip()
    image_url = payload.get("image_url")
    voice_url = payload.get("voice_url")
    voice_duration = payload.get("voice_duration")
    sender_handle = payload.get("sender_handle", "citizen_farmer")
    sender_name = payload.get("sender_name", "Citizen Farmer")
    sender_avatar = payload.get("sender_avatar", "/logo.png")
    reply_to = payload.get("reply_to")

    if not text and not image_url and not voice_url:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    media_type = "voice" if voice_url else ("image" if image_url else "text")
    display_text = text or ("Voice message" if voice_url else "Photo attachment")

    msg_doc = {
        "id": f"msg_{uuid.uuid4().hex[:10]}",
        "sender_handle": sender_handle,
        "sender_name": sender_name,
        "sender_avatar": sender_avatar,
        "recipient_handle": other_handle,
        "text": display_text,
        "media_type": media_type,
        "image_url": image_url,
        "voice_url": voice_url,
        "voice_duration": voice_duration,
        "reply_to": reply_to,
        "created_at": datetime.utcnow().isoformat(),
        "read": False
    }

    db = get_mongo_db()
    if db is not None:
        try:
            await db["chaupal_direct_messages"].insert_one(msg_doc.copy())

            if other_handle != sender_handle:
                background_tasks.add_task(
                    create_in_app_notification,
                    recipient_handle=other_handle,
                    actor_handle=sender_handle,
                    actor_name=sender_name,
                    actor_avatar=sender_avatar,
                    type="message",
                    text=f'"{display_text[:80]}"',
                    action_url=f"/dashboard/chaupal/messages?user={sender_handle}"
                )

                background_tasks.add_task(
                    trigger_user_email_notification,
                    recipient_handle=other_handle,
                    event_type="message",
                    actor_name=sender_name,
                    body_text=f"\"{display_text}\"",
                    action_url=f"{get_frontend_base_url()}/dashboard/chaupal/messages?user={sender_handle}"
                )
        except Exception as e:
            logger.warning(f"Error inserting direct message: {e}")

    return {"success": True, "message": msg_doc}


@router.post("/messages/{other_handle}/archive", summary="Toggle archive/unarchive chat conversation")
async def toggle_archive_conversation(
    other_handle: str,
    payload: Dict[str, Any] = Body(...)
):
    current_user = payload.get("user_handle", "citizen_farmer")
    db = get_mongo_db()
    is_archived = False

    if db is not None:
        try:
            existing = await db["chaupal_archived_chats"].find_one({
                "user_handle": current_user,
                "other_handle": other_handle
            })
            if existing:
                await db["chaupal_archived_chats"].delete_one({"_id": existing["_id"]})
                is_archived = False
            else:
                await db["chaupal_archived_chats"].insert_one({
                    "user_handle": current_user,
                    "other_handle": other_handle,
                    "archived_at": datetime.utcnow().isoformat()
                })
                is_archived = True
        except Exception as e:
            logger.warning(f"Error toggling chat archive: {e}")

    return {"success": True, "is_archived": is_archived, "message": f"{'Archived' if is_archived else 'Unarchived'} conversation with @{other_handle}"}


@router.get("/messages/archived/list", summary="Get list of archived chat handles")
async def get_archived_conversations(current_user: str = Query("citizen_farmer")):
    db = get_mongo_db()
    archived_handles = []

    if db is not None:
        try:
            cursor = db["chaupal_archived_chats"].find({"user_handle": current_user})
            async for doc in cursor:
                archived_handles.append(doc.get("other_handle"))
        except Exception as e:
            logger.warning(f"Error reading archived chats: {e}")

    return {"success": True, "archived_handles": archived_handles}


@router.post("/messages/{other_handle}/block", summary="Toggle block/unblock farmer")
async def toggle_block_farmer(
    other_handle: str,
    payload: Dict[str, Any] = Body(...)
):
    current_user = payload.get("user_handle", "citizen_farmer")
    db = get_mongo_db()
    is_blocked = False

    if db is not None:
        try:
            existing = await db["chaupal_blocked_users"].find_one({
                "blocker_handle": current_user,
                "blocked_handle": other_handle
            })
            if existing:
                await db["chaupal_blocked_users"].delete_one({"_id": existing["_id"]})
                is_blocked = False
            else:
                await db["chaupal_blocked_users"].insert_one({
                    "blocker_handle": current_user,
                    "blocked_handle": other_handle,
                    "blocked_at": datetime.utcnow().isoformat()
                })
                is_blocked = True
        except Exception as e:
            logger.warning(f"Error toggling block: {e}")

    return {"success": True, "is_blocked": is_blocked, "message": f"{'Blocked' if is_blocked else 'Unblocked'} @{other_handle}"}


@router.get("/messages/blocked/list", summary="Get list of blocked handles")
async def get_blocked_users(current_user: str = Query("citizen_farmer")):
    db = get_mongo_db()
    blocked_handles = []

    if db is not None:
        try:
            cursor = db["chaupal_blocked_users"].find({"blocker_handle": current_user})
            async for doc in cursor:
                blocked_handles.append(doc.get("blocked_handle"))
        except Exception as e:
            logger.warning(f"Error reading blocked users: {e}")

    return {"success": True, "blocked_handles": blocked_handles}


@router.delete("/messages/{other_handle}/clear", summary="Clear chat history with a user")
async def clear_chat_history(
    other_handle: str,
    current_user: str = Query("citizen_farmer")
):
    db = get_mongo_db()
    if db is not None:
        try:
            await db["chaupal_direct_messages"].delete_many({
                "$or": [
                    {"sender_handle": current_user, "recipient_handle": other_handle},
                    {"sender_handle": other_handle, "recipient_handle": current_user}
                ]
            })
        except Exception as e:
            logger.warning(f"Error clearing chat history: {e}")

    return {"success": True, "message": f"Cleared chat history with @{other_handle}"}


@router.post("/messages/{message_id}/react", summary="React to a message with an emoji")
async def react_to_message(
    message_id: str,
    payload: Dict[str, Any] = Body(...)
):
    user_handle = payload.get("user_handle", "citizen_farmer")
    emoji = payload.get("emoji", "👍")
    db = get_mongo_db()

    updated_reactions = {}
    if db is not None:
        try:
            msg = await db["chaupal_direct_messages"].find_one({"id": message_id})
            if msg:
                reactions = msg.get("reactions", {})
                current_user_reaction = reactions.get(user_handle)

                if current_user_reaction == emoji:
                    reactions.pop(user_handle, None)
                else:
                    reactions[user_handle] = emoji

                await db["chaupal_direct_messages"].update_one(
                    {"id": message_id},
                    {"$set": {"reactions": reactions}}
                )
                updated_reactions = reactions
        except Exception as e:
            logger.warning(f"Error reacting to message: {e}")

    return {"success": True, "reactions": updated_reactions}


# -------------------------------------------------------------
# 5. KRISHI MARKETPLACE (100% DATABASE DRIVEN)
# -------------------------------------------------------------

@router.get("/marketplace", summary="Get 100% database-driven Krishi marketplace listings")
async def get_marketplace(
    category: Optional[str] = None,
    query: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 30
):
    db = get_mongo_db()
    items = []
    if db is not None:
        try:
            filter_q: Dict[str, Any] = {"status": "AVAILABLE"}
            if category and category.lower() != "all":
                filter_q["category"] = {"$regex": category, "$options": "i"}
            if query:
                filter_q["$or"] = [
                    {"title": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"location": {"$regex": query, "$options": "i"}}
                ]
            if location:
                filter_q["location"] = {"$regex": location, "$options": "i"}

            cursor = db["chaupal_marketplace"].find(filter_q).sort("created_at", -1).limit(limit)
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                items.append(doc)
        except Exception as e:
            logger.warning(f"Error fetching marketplace items: {e}")

    return {"success": True, "count": len(items), "items": items}


@router.post("/marketplace", summary="Create new produce or equipment listing in database")
async def create_marketplace_item(payload: Dict[str, Any] = Body(...)):
    title = payload.get("title", "").strip()
    price = payload.get("price")
    if not title or price is None:
        raise HTTPException(status_code=400, detail="Title and price are required")

    item_id = f"mkt_{uuid.uuid4().hex[:10]}"
    phone = payload.get("phone", "+91 98450 00000")
    clean_phone = re.sub(r"[^\d]", "", phone)

    item_doc = {
        "id": item_id,
        "title": title,
        "category": payload.get("category", "Crops & Grains"),
        "price": float(price),
        "unit": payload.get("unit", "Quintal"),
        "quantity_available": payload.get("quantity_available", "1 Lot"),
        "min_order": payload.get("min_order", "1 Unit"),
        "variety": payload.get("variety", ""),
        "grade": payload.get("grade", "Grade A Standard"),
        "moisture_content": payload.get("moisture_content", ""),
        "packaging_type": payload.get("packaging_type", "Standard Packaging"),
        "delivery_mode": payload.get("delivery_mode", "Farm Gate Pickup"),
        "negotiation_terms": payload.get("negotiation_terms", "Negotiable"),
        "payment_terms": payload.get("payment_terms", "Instant UPI / Bank Transfer"),
        "location": payload.get("location", "Karnataka, India"),
        "state": payload.get("state", "Karnataka"),
        "images": payload.get("images", ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80"]),
        "seller": {
            "user_id": payload.get("user_id", "current_user"),
            "name": payload.get("name", "Citizen Farmer"),
            "username": payload.get("username", "citizen_farmer"),
            "phone": phone,
            "whatsapp": clean_phone,
            "village": payload.get("village", "Karnataka"),
            "avatar_url": payload.get("avatar_url", "/logo.png"),
            "is_verified": True
        },
        "description": payload.get("description", ""),
        "organic_certified": payload.get("organic_certified", False),
        "harvest_date": payload.get("harvest_date", datetime.utcnow().strftime("%Y-%m-%d")),
        "status": "AVAILABLE",
        "created_at": datetime.utcnow().isoformat()
    }

    db = get_mongo_db()
    if db is not None:
        try:
            await db["chaupal_marketplace"].insert_one(item_doc.copy())
        except Exception as e:
            logger.warning(f"Error inserting marketplace item into MongoDB: {e}")

    return {"success": True, "item": item_doc}


@router.get("/marketplace/{item_id}", summary="Get single product details")
async def get_marketplace_item(item_id: str):
    db = get_mongo_db()
    if db is not None:
        try:
            item = await db["chaupal_marketplace"].find_one({"$or": [{"id": item_id}, {"_id": item_id}]})
            if item:
                item["_id"] = str(item["_id"])
                return {"success": True, "item": item}
        except Exception as e:
            logger.warning(f"Error fetching item {item_id}: {e}")

    raise HTTPException(status_code=404, detail="Marketplace listing not found")


@router.put("/marketplace/{item_id}", summary="Update marketplace listing")
async def update_marketplace_item(item_id: str, payload: Dict[str, Any] = Body(...)):
    db = get_mongo_db()
    if db is not None:
        try:
            update_data = {
                k: v for k, v in payload.items() if k not in ["_id", "id", "created_at"]
            }
            update_data["updated_at"] = datetime.utcnow().isoformat()
            res = await db["chaupal_marketplace"].update_one(
                {"$or": [{"id": item_id}, {"_id": item_id}]},
                {"$set": update_data}
            )
            if res.matched_count > 0:
                item = await db["chaupal_marketplace"].find_one({"$or": [{"id": item_id}, {"_id": item_id}]})
                if item:
                    item["_id"] = str(item["_id"])
                return {"success": True, "item": item}
        except Exception as e:
            logger.warning(f"Error updating item {item_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Item not found")


@router.delete("/marketplace/{item_id}", summary="Delete marketplace listing")
async def delete_marketplace_item(item_id: str):
    db = get_mongo_db()
    if db is not None:
        try:
            res = await db["chaupal_marketplace"].delete_one({"$or": [{"id": item_id}, {"_id": item_id}]})
            if res.deleted_count > 0:
                return {"success": True, "message": "Marketplace listing removed", "id": item_id}
        except Exception as e:
            logger.warning(f"Error deleting marketplace item {item_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Item not found")


# -------------------------------------------------------------
# 6. DEDICATED SOCIAL PROFILES, EDIT BIO & REAL FOLLOWERS
# -------------------------------------------------------------

@router.get("/profile/{username}", summary="Get farmer profile with real followers count")
async def get_farmer_profile(username: str, current_user: str = Query("citizen_farmer")):
    clean_username = normalize_handle(username)
    clean_current_user = normalize_handle(current_user)

    db = get_mongo_db()
    user_doc = None
    posts = []
    market_items = []
    followers_count = 0
    following_count = 0
    is_following = False

    if db is None:
        raise HTTPException(status_code=503, detail="Database connection is currently unavailable")

    try:
        user_doc = await db["users"].find_one({
            "$or": [
                {"handle": clean_username},
                {"username": clean_username},
                {"handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}},
                {"username": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
            ]
        })
        cursor_p = db["chaupal_posts"].find({
            "$or": [
                {"author.username": clean_username},
                {"author.username": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
            ]
        }).sort("created_at", -1)
        async for doc in cursor_p:
            doc["_id"] = str(doc["_id"])
            posts.append(doc)

        cursor_m = db["chaupal_marketplace"].find({
            "$or": [
                {"seller.username": clean_username},
                {"seller.username": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
            ]
        }).sort("created_at", -1)
        async for doc in cursor_m:
            doc["_id"] = str(doc["_id"])
            market_items.append(doc)

        # Real follow counts in MongoDB
        followers_count = await db["chaupal_follows"].count_documents({
            "$or": [
                {"following_handle": clean_username},
                {"following_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
            ]
        })
        following_count = await db["chaupal_follows"].count_documents({
            "$or": [
                {"follower_handle": clean_username},
                {"follower_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
            ]
        })
        is_following_doc = await db["chaupal_follows"].find_one({
            "$and": [
                {"$or": [{"follower_handle": clean_current_user}, {"follower_handle": {"$regex": f"^{re.escape(clean_current_user)}$", "$options": "i"}}]},
                {"$or": [{"following_handle": clean_username}, {"following_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}]}
            ]
        })
        is_following = is_following_doc is not None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting profile from MongoDB for {clean_username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve profile: {str(e)}")

    name = clean_username.replace("_", " ").title()
    village = "Karnataka, India"
    avatar_url = "/logo.png"
    banner_url = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80"
    bio = "Progressive Indian farmer cultivating crops with sustainable methods. Open for direct trade on Krishi Mandi."
    primary_crops = ["Paddy", "Sugarcane"]
    landholding_acres = 4.5
    badge = "Farmer"
    is_official = False
    is_verified = True

    if clean_username in ("gramsetu_official", "gramsetu_gov"):
        name = "GramSetu Official"
        village = "National Civic Network"
        avatar_url = "/logo.png"
        bio = "Official citizen welfare and agricultural advisory portal of GramSetu AI. Direct government announcements, subsidies, and PM-KISAN notifications."
        badge = "Official Platform"
        is_official = True
        is_verified = True
    elif user_doc:
        name = user_doc.get("name", name)
        village = f"{user_doc.get('village', 'Village')}, {user_doc.get('district', 'District')}"
        avatar_url = user_doc.get("avatar_url", avatar_url)
        bio = user_doc.get("bio", bio)
        primary_crops = user_doc.get("primary_crops", primary_crops)
        landholding_acres = user_doc.get("landholding_acres", landholding_acres)
        badge = user_doc.get("badge", badge)
        is_verified = user_doc.get("is_verified", True)

    return {
        "success": True,
        "profile": {
            "username": clean_username,
            "name": name,
            "avatar_url": avatar_url,
            "banner_url": banner_url,
            "village": village,
            "state": "Karnataka",
            "bio": bio,
            "badge": badge,
            "primary_crops": primary_crops,
            "landholding_acres": landholding_acres,
            "is_verified": is_verified,
            "is_official": is_official,
            "is_following": is_following,
            "followers_count": followers_count,
            "following_count": following_count,
            "posts_count": len(posts),
            "marketplace_count": len(market_items),
            "posts": posts,
            "marketplace_items": market_items
        }
    }


@router.put("/profile/me", summary="Update my farmer profile (bio, avatar, name, village)")
async def update_my_profile(payload: Dict[str, Any] = Body(...)):
    user_handle = normalize_handle(payload.get("username", "citizen_farmer"))
    db = get_mongo_db()

    updates = {}
    if "bio" in payload:
        updates["bio"] = payload["bio"].strip()
    if "name" in payload:
        updates["name"] = payload["name"].strip()
    if "avatar_url" in payload:
        updates["avatar_url"] = payload["avatar_url"]
    if "village" in payload:
        updates["village"] = payload["village"].strip()
    if "district" in payload:
        updates["district"] = payload["district"].strip()
    if "primary_crops" in payload:
        updates["primary_crops"] = payload["primary_crops"]

    if db is None:
        raise HTTPException(status_code=503, detail="Database connection is unavailable")

    try:
        await db["users"].update_one(
            {"$or": [
                {"handle": user_handle},
                {"username": user_handle},
                {"handle": {"$regex": f"^{re.escape(user_handle)}$", "$options": "i"}},
                {"username": {"$regex": f"^{re.escape(user_handle)}$", "$options": "i"}}
            ]},
            {"$set": updates},
            upsert=True
        )

        # Update author snapshot on recent posts
        if "name" in updates or "avatar_url" in updates or "village" in updates:
            author_updates = {}
            if "name" in updates: author_updates["author.name"] = updates["name"]
            if "avatar_url" in updates: author_updates["author.avatar_url"] = updates["avatar_url"]
            if "village" in updates: author_updates["author.village"] = updates["village"]
            await db["chaupal_posts"].update_many(
                {"author.username": user_handle},
                {"$set": author_updates}
            )
    except Exception as e:
        logger.error(f"Error updating user profile in MongoDB: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

    return {"success": True, "message": "Profile updated successfully", "updates": updates}


@router.post("/profile/{username}/follow", summary="Toggle follow/unfollow with real MongoDB tracking")
async def toggle_follow(
    username: str,
    background_tasks: BackgroundTasks,
    payload: Dict[str, Any] = Body(...)
):
    clean_target = normalize_handle(username)
    clean_current = normalize_handle(payload.get("user_id", payload.get("username", "citizen_farmer")))
    actor_name = payload.get("name") or clean_current.replace("_", " ").title()

    if clean_target == clean_current:
        raise HTTPException(status_code=400, detail="You cannot follow your own profile.")

    db = get_mongo_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection is currently unavailable.")

    following = False
    new_followers_count = 0

    try:
        existing = await db["chaupal_follows"].find_one({
            "$and": [
                {"$or": [{"follower_handle": clean_current}, {"follower_handle": {"$regex": f"^{re.escape(clean_current)}$", "$options": "i"}}]},
                {"$or": [{"following_handle": clean_target}, {"following_handle": {"$regex": f"^{re.escape(clean_target)}$", "$options": "i"}}]}
            ]
        })

        if existing:
            await db["chaupal_follows"].delete_one({"_id": existing["_id"]})
            following = False
        else:
            await db["chaupal_follows"].insert_one({
                "id": f"f_{uuid.uuid4().hex[:8]}",
                "follower_handle": clean_current,
                "following_handle": clean_target,
                "created_at": datetime.utcnow().isoformat()
            })
            following = True

            if clean_target != clean_current and clean_target not in ("gramsetu_official", "gramsetu_gov"):
                background_tasks.add_task(
                    create_in_app_notification,
                    recipient_handle=clean_target,
                    actor_handle=clean_current,
                    actor_name=actor_name,
                    actor_avatar=payload.get("avatar_url", "/logo.png"),
                    type="follow",
                    text="started following your farm updates & harvests",
                    action_url=f"/dashboard/chaupal/profile/{clean_current}"
                )

                background_tasks.add_task(
                    trigger_user_email_notification,
                    recipient_handle=clean_target,
                    event_type="follow",
                    actor_name=actor_name,
                    body_text="Started following your updates on Kisan Chaupal.",
                    action_url=f"{get_frontend_base_url()}/dashboard/chaupal/profile/{clean_current}"
                )

        new_followers_count = await db["chaupal_follows"].count_documents({
            "$or": [
                {"following_handle": clean_target},
                {"following_handle": {"$regex": f"^{re.escape(clean_target)}$", "$options": "i"}}
            ]
        })
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling follow for target={clean_target} by={clean_current}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error updating follow status: {str(e)}")

    return {
        "success": True,
        "following": following,
        "followers_count": new_followers_count,
        "message": f"{'Now following' if following else 'Unfollowed'} @{clean_target}"
    }


@router.get("/profile/{username}/followers", summary="Get list of followers for a user")
async def get_user_followers(username: str, current_user: str = Query("citizen_farmer")):
    clean_username = normalize_handle(username)
    clean_current = normalize_handle(current_user)

    db = get_mongo_db()
    followers = []

    if db is not None:
        try:
            cursor = db["chaupal_follows"].find({
                "$or": [
                    {"following_handle": clean_username},
                    {"following_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
                ]
            }).sort("created_at", -1)
            handles = []
            async for doc in cursor:
                handles.append(normalize_handle(doc.get("follower_handle")))

            if handles:
                users_cursor = db["users"].find({"$or": [{"handle": {"$in": handles}}, {"username": {"$in": handles}}]})
                users_map = {}
                async for u in users_cursor:
                    h = normalize_handle(u.get("handle") or u.get("username"))
                    if h:
                        users_map[h] = u

                for h in handles:
                    u = users_map.get(h, {})
                    is_following_this_user = await db["chaupal_follows"].find_one({
                        "$and": [
                            {"$or": [{"follower_handle": clean_current}, {"follower_handle": {"$regex": f"^{re.escape(clean_current)}$", "$options": "i"}}]},
                            {"$or": [{"following_handle": h}, {"following_handle": {"$regex": f"^{re.escape(h)}$", "$options": "i"}}]}
                        ]
                    }) is not None

                    followers.append({
                        "username": h,
                        "name": u.get("name") or h.replace("_", " ").title(),
                        "avatar_url": u.get("avatar_url", "/logo.png"),
                        "village": f"{u.get('village', 'Village')}, {u.get('district', 'District')}" if u.get("village") else "Karnataka, India",
                        "is_verified": u.get("is_verified", True),
                        "is_official": h in ("gramsetu_official", "gramsetu_gov"),
                        "is_following": is_following_this_user
                    })
        except Exception as e:
            logger.error(f"Error fetching followers list for {clean_username}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to retrieve followers: {str(e)}")

    return {"success": True, "count": len(followers), "followers": followers}


@router.get("/profile/{username}/following", summary="Get list of accounts followed by a user")
async def get_user_following(username: str, current_user: str = Query("citizen_farmer")):
    clean_username = normalize_handle(username)
    clean_current = normalize_handle(current_user)

    db = get_mongo_db()
    following = []

    if db is not None:
        try:
            cursor = db["chaupal_follows"].find({
                "$or": [
                    {"follower_handle": clean_username},
                    {"follower_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
                ]
            }).sort("created_at", -1)
            handles = []
            async for doc in cursor:
                handles.append(normalize_handle(doc.get("following_handle")))

            if handles:
                users_cursor = db["users"].find({"$or": [{"handle": {"$in": handles}}, {"username": {"$in": handles}}]})
                users_map = {}
                async for u in users_cursor:
                    h = normalize_handle(u.get("handle") or u.get("username"))
                    if h:
                        users_map[h] = u

                for h in handles:
                    if h in ("gramsetu_official", "gramsetu_gov"):
                        is_following_official = await db["chaupal_follows"].find_one({
                            "$and": [
                                {"$or": [{"follower_handle": clean_current}, {"follower_handle": {"$regex": f"^{re.escape(clean_current)}$", "$options": "i"}}]},
                                {"$or": [{"following_handle": h}, {"following_handle": {"$regex": f"^{re.escape(h)}$", "$options": "i"}}]}
                            ]
                        }) is not None
                        following.append({
                            "username": h,
                            "name": "GramSetu Official",
                            "avatar_url": "/logo.png",
                            "village": "National Civic Network",
                            "is_verified": True,
                            "is_official": True,
                            "is_following": is_following_official
                        })
                        continue

                    u = users_map.get(h, {})
                    is_following_this_user = await db["chaupal_follows"].find_one({
                        "$and": [
                            {"$or": [{"follower_handle": clean_current}, {"follower_handle": {"$regex": f"^{re.escape(clean_current)}$", "$options": "i"}}]},
                            {"$or": [{"following_handle": h}, {"following_handle": {"$regex": f"^{re.escape(h)}$", "$options": "i"}}]}
                        ]
                    }) is not None

                    following.append({
                        "username": h,
                        "name": u.get("name") or h.replace("_", " ").title(),
                        "avatar_url": u.get("avatar_url", "/logo.png"),
                        "village": f"{u.get('village', 'Village')}, {u.get('district', 'District')}" if u.get("village") else "Karnataka, India",
                        "is_verified": u.get("is_verified", True),
                        "is_official": False,
                        "is_following": is_following_this_user
                    })
        except Exception as e:
            logger.error(f"Error fetching following list for {clean_username}: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to retrieve following list: {str(e)}")

    return {"success": True, "count": len(following), "following": following}


# -------------------------------------------------------------
# 7. TRENDING & USER SUGGESTIONS FROM DATABASE
# -------------------------------------------------------------

@router.get("/trending", summary="Get dynamic agricultural trending hashtags")
async def get_trending_topics():
    db = get_mongo_db()
    trends = []
    if db is not None:
        try:
            cursor = db["chaupal_posts"].find({}, {"hashtags": 1, "crop_tag": 1}).limit(50)
            tag_counts: Dict[str, int] = {}
            async for doc in cursor:
                for h in doc.get("hashtags", []):
                    tag_counts[h] = tag_counts.get(h, 0) + 1
                crop = doc.get("crop_tag")
                if crop:
                    tag_counts[f"#{crop.split()[0]}"] = tag_counts.get(f"#{crop.split()[0]}", 0) + 1

            for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:6]:
                trends.append({
                    "tag": tag,
                    "count": f"{count * 120 + 45} discussions",
                    "desc": "Active farmer topic"
                })
        except Exception as e:
            logger.warning(f"Error aggregating trends: {e}")

    if not trends:
        trends = [
            {"tag": "#PMKISAN", "count": "18.2k discussions", "desc": "17th Installment DBT credit confirmation"},
            {"tag": "#PMKUSUM_SolarPumps", "count": "6.4k discussions", "desc": "90% subsidy for solar agricultural pumps"},
            {"tag": "#Mandya_Sugarcane", "count": "3.8k updates", "desc": "Drip fertigation and FRP rates"},
        ]

    return {"success": True, "trends": trends}


@router.get("/suggestions", summary="Get suggested platform users to follow from database")
async def get_suggested_users(current_user: str = Query("citizen_farmer")):
    db = get_mongo_db()
    suggestions = []

    if db is not None:
        try:
            cursor = db["users"].find({
                "$and": [
                    {"handle": {"$nin": [current_user, "gramsetu_official", "gramsetu_gov"]}},
                    {"username": {"$nin": [current_user, "gramsetu_official", "gramsetu_gov"]}}
                ]
            }).limit(10)
            async for u in cursor:
                uname = u.get("handle") or u.get("username")
                if not uname or uname == current_user or uname in ("gramsetu_official", "gramsetu_gov"):
                    continue
                suggestions.append({
                    "username": uname,
                    "name": u.get("name", uname.replace("_", " ").title()),
                    "avatar_url": u.get("avatar_url") or "/logo.png",
                    "badge": u.get("badge") or "Registered Farmer",
                    "village": f"{u.get('village', 'Karnataka')}, {u.get('district', 'India')}",
                    "is_verified": u.get("is_verified", False),
                    "is_official": False
                })
        except Exception as e:
            logger.warning(f"Error querying users for suggestions: {e}")

    return {"success": True, "suggestions": suggestions}


# -------------------------------------------------------------
# 7. IN-APP NOTIFICATIONS SYSTEM
# -------------------------------------------------------------

@router.get("/notifications", summary="Get user in-app notifications with unread count")
async def get_notifications(
    username: str = Query("citizen_farmer"),
    limit: int = Query(30)
):
    clean_username = normalize_handle(username)
    db = get_mongo_db()
    notifs = []
    unread_count = 0

    if db is None:
        raise HTTPException(status_code=503, detail="Database connection is unavailable")

    try:
        cursor = db["chaupal_notifications"].find(
            {"$or": [
                {"recipient_handle": clean_username},
                {"recipient_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}},
                {"recipient_handle": "all"}
            ]}
        ).sort("created_at", -1).limit(limit)

        actor_handles = set()
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if not doc.get("is_read"):
                unread_count += 1
            actor_h = normalize_handle(doc.get("actor_handle", ""))
            if actor_h:
                actor_handles.add(actor_h)
            notifs.append(doc)

        # Query follow states for all actors in the notifications list
        following_set = set()
        if actor_handles:
            follow_cursor = db["chaupal_follows"].find({
                "follower_handle": clean_username,
                "following_handle": {"$in": list(actor_handles)}
            })
            async for f_doc in follow_cursor:
                following_set.add(normalize_handle(f_doc.get("following_handle")))

        for doc in notifs:
            doc_actor = normalize_handle(doc.get("actor_handle", ""))
            doc["is_following"] = doc_actor in following_set
    except Exception as e:
        logger.error(f"Error fetching in-app notifications for {clean_username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve notifications: {str(e)}")

    # If empty, return a welcoming seed notification
    if not notifs:
        notifs = [
            {
                "id": "notif_welcome",
                "recipient_handle": clean_username,
                "actor_handle": "gramsetu_official",
                "actor_name": "GramSetu Community",
                "actor_avatar": "/logo.png",
                "type": "welcome",
                "text": "Welcome to Kisan Chaupal! Connect with fellow farmers, ask legal guidance, and trade crops directly.",
                "action_url": "/dashboard/chaupal",
                "is_read": True,
                "is_following": False,
                "created_at": datetime.utcnow().isoformat()
            }
        ]

    return {
        "success": True,
        "count": len(notifs),
        "unread_count": unread_count,
        "notifications": notifs
    }


@router.post("/notifications/read", summary="Mark notifications as read")
async def mark_notifications_read(payload: Dict[str, Any] = Body(...)):
    clean_username = normalize_handle(payload.get("username", "citizen_farmer"))
    notification_id = payload.get("notification_id")
    db = get_mongo_db()

    if db is None:
        raise HTTPException(status_code=503, detail="Database connection is unavailable")

    try:
        if notification_id:
            res = await db["chaupal_notifications"].update_one(
                {"id": notification_id},
                {"$set": {"is_read": True}}
            )
            return {"success": True, "marked": res.modified_count}
        else:
            res = await db["chaupal_notifications"].update_many(
                {
                    "$or": [
                        {"recipient_handle": clean_username},
                        {"recipient_handle": {"$regex": f"^{re.escape(clean_username)}$", "$options": "i"}}
                    ],
                    "is_read": False
                },
                {"$set": {"is_read": True}}
            )
            return {"success": True, "marked": res.modified_count}
    except Exception as e:
        logger.error(f"Error marking notifications as read: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update read status: {str(e)}")


@router.delete("/notifications/{notification_id}", summary="Delete single notification")
async def delete_notification(notification_id: str):
    db = get_mongo_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection is unavailable")

    try:
        res = await db["chaupal_notifications"].delete_one({"id": notification_id})
        if res.deleted_count > 0:
            return {"success": True, "message": "Notification removed", "id": notification_id}
        return {"success": True, "message": "Notification already dismissed", "id": notification_id}
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete notification: {str(e)}")
