#!/usr/bin/env python3

import random
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, TypedDict, Union

import ipsum


class User(TypedDict):
    user_id: int
    username: str
    timezone_id: int
    created_at: str


class Article(TypedDict):
    article_id: int
    title: str
    body: str
    user_id: int
    created_at: str


class Comment(TypedDict):
    comment_id: int
    body: str
    user_id: int
    article_id: int
    created_at: str


def generate_random_date(no_earlier_than: Optional[str] = None) -> str:
    _no_earlier_than = datetime.fromisoformat(no_earlier_than or "2019-01-01T00:00:00")

    while True:
        year = random.randint(2019, 2022)
        month = random.randint(1, 12)

        if month in [1, 3, 5, 7, 8, 10, 12]:
            day = random.randint(1, 31)
        elif month in [4, 6, 9, 11]:
            day = random.randint(1, 30)
        elif year % 4 == 0 and year % 100 != 0 or year % 400 == 0:
            day = random.randint(1, 29)
        else:
            day = random.randint(1, 28)

        hour = random.randint(0, 23)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)

        dt = datetime(year, month, day, hour, minute, second)
        if dt >= _no_earlier_than:
            break

    return dt.isoformat()

def create_users(
    num: int, timezone_ids: List[int], ipsum: ipsum.LanguageModel
) -> List[User]:
    def generate_username() -> str:
        _word = ipsum.generate_words(1)[0]
        word = re.sub(r"[^\w]", "", _word)
        suffix = "".join(
            [str(random.randint(0, 9)) for _ in range(random.randint(0, 3))]
        )
        return f"{word}{suffix}"

    users = []
    for i in range(num):
        record = {
            "user_id": i + 1,
            "username": generate_username(),
            "timezone_id": random.choice(timezone_ids),
            "created_at": generate_random_date(),
        }
        users.append(record)
    return users


def create_articles(
    num: int, users: List[User], ipsum: ipsum.LanguageModel
) -> List[Article]:
    articles = []
    for i in range(num):
        user = random.choice(users)
        record = {
            "article_id": i + 1,
            "title": " ".join(ipsum.generate_words(10)),
            "body": ipsum.generate_sentences(1)[0],
            "user_id": user["user_id"],
            "created_at": generate_random_date(user["created_at"]),
        }
        articles.append(record)
    return articles


def create_comments(
    num: int, users: List[User], articles: List[Article], ipsum: ipsum.LanguageModel
) -> List[Comment]:
    comments = []
    for i in range(num):
        user = random.choice(users)
        article = random.choice(articles)
        record = {
            "comment_id": i + 1,
            "body": ipsum.generate_sentences(1)[0],
            "user_id": user["user_id"],
            "article_id": article["article_id"],
        }
        later = max(
            datetime.fromisoformat(article["created_at"]),
            datetime.fromisoformat(user["created_at"]),
        )
        record["created_at"] = generate_random_date(later.isoformat())
        comments.append(record)
    return comments


def to_csv(records: List[Dict[str, str]]) -> str:
    def stringify(value: Union[str, int, float]) -> str:
        if isinstance(value, str):
            _value = value.replace('"', "'")
            return f'"{_value}"'
        return str(value)

    header = ",".join(records[0].keys())
    records_csv = "\n".join(
        [",".join(map(stringify, record.values())) for record in records]
    )
    return f"{header}\n{records_csv}"


def main():
    _ipsum = ipsum.load_model("en")

    users = create_users(100, range(1, 213), _ipsum)
    articles = create_articles(1000, users, _ipsum)
    comments = create_comments(3000, users, articles, _ipsum)

    public = Path(__file__).parent.parent / "public"
    (public / "users.csv").write_text(to_csv(users))
    (public / "articles.csv").write_text(to_csv(articles))
    (public / "comments.csv").write_text(to_csv(comments))


if __name__ == "__main__":
    main()
