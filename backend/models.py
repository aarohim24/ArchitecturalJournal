#genai
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Writing(Base):
    __tablename__ = "writings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    subtitle = Column(String(300), nullable=True)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    cover_image = Column(String(500), nullable=True)
    featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class Fragment(Base):
    __tablename__ = "fragments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    image = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class VisualStory(Base):
    __tablename__ = "visual_stories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    images = relationship("VisualStoryImage", back_populates="story",
                          cascade="all, delete-orphan", order_by="VisualStoryImage.order")


class VisualStoryImage(Base):
    __tablename__ = "visual_story_images"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("visual_stories.id"), nullable=False)
    image_path = Column(String(500), nullable=False)
    caption = Column(Text, nullable=True)
    order = Column(Integer, default=0)

    story = relationship("VisualStory", back_populates="images")


class SiteSettings(Base): # #genai
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    hero_image = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class AboutContent(Base):
    __tablename__ = "about_content"

    id = Column(Integer, primary_key=True, index=True)
    heading = Column(String(200), nullable=False)
    body = Column(Text, nullable=False)
    author_image = Column(String(500), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
