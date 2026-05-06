from __future__ import annotations

import json
from pathlib import Path
from statistics import mean

from flask import Flask, redirect, render_template, url_for

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "courses_data.json"
DB_PATH = BASE_DIR / "data" / "courses.db"

app = Flask(__name__)

CATEGORY_LABELS = {
    "code": "IT и разработка",
    "design": "Дизайн",
    "marketing": "Маркетинг",
    "analytics": "Аналитика",
    "product": "Продакт-менеджмент",
    "management": "Менеджмент",
    "business": "Бизнес",
    "finance": "Финансы",
    "language": "Языки",
    "hard": "Прикладные навыки",
}

CATEGORY_ORDER = ["code", "design", "marketing", "analytics", "product", "management", "business", "finance", "language", "hard"]


def load_courses() -> list[dict]:
    with DATA_PATH.open("r", encoding="utf-8") as f:
        courses = json.load(f)

    for course in courses:
        course["course_name"] = course.get("course", "")
        course["category_label"] = CATEGORY_LABELS.get(course.get("category", ""), course.get("category", "").title())
        course["price_display"] = f"{course['price_rub']:,}".replace(",", " ")
        course["monthly_display"] = f"{course['monthly_payment_rub']:,}".replace(",", " ")
        course["projects_label"] = f"{course['projects_count']} проект{'' if course['projects_count'] == 1 else 'а' if course['projects_count'] in (2, 3, 4) else 'ов'}"
        course["career_label"] = "Есть" if course.get("career_support") else "Нет"
        course["internship_label"] = "Есть" if course.get("internship") else "Нет"
        course["certificate_label"] = "Есть" if course.get("certificate") else "Нет"
        course["practice_width"] = max(0, min(100, int(course.get("practice_percent", 0))))
    return courses


def build_course_context() -> dict:
    courses = load_courses()
    categories_in_data = {course["category"] for course in courses}
    ordered_categories = [category for category in CATEGORY_ORDER if category in categories_in_data]
    ordered_categories += sorted(categories_in_data - set(ordered_categories))
    categories = [
        {"value": category, "label": CATEGORY_LABELS.get(category, category.title())}
        for category in ordered_categories
    ]

    stats = {
        "total_schools": len({course["school"] for course in courses}),
        "total_courses": len(courses),
        "total_directions": len(categories),
        "avg_rating": round(mean(course["rating"] for course in courses), 1),
        "avg_practice": round(mean(course["practice_percent"] for course in courses)),
        "avg_duration": round(mean(course["duration_weeks"] for course in courses)),
        "min_price": min(course["price_rub"] for course in courses),
        "max_price": max(course["price_rub"] for course in courses),
    }

    ranked = sorted(courses, key=lambda c: (c["rating"], c["practice_percent"], -c["price_rub"]), reverse=True)
    featured = ranked[0]

    featured_card = {
        "school": featured["school"],
        "course_name": featured["course_name"],
        "category": featured["category_label"],
        "rating": featured["rating"],
        "practice_percent": featured["practice_percent"],
        "price_rub": featured["price_display"],
        "highlight": featured["highlight"],
        "duration_weeks": featured["duration_weeks"],
    }

    top_courses = [
        {
            "school": course["school"],
            "course_name": course["course_name"],
            "rating": course["rating"],
            "category": course["category_label"],
            "price": course["price_display"],
            "practice": course["practice_percent"],
        }
        for course in ranked[:3]
    ]

    return {
        "courses": courses,
        "categories": categories,
        "stats": stats,
        "featured": featured_card,
        "top_courses": top_courses,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/courses")
def courses():
    return render_template("courses.html", **build_course_context())


@app.route("/catalog")
def catalog():
    return render_template("courses")


@app.route("/schools")
def schools():
    return render_template("schools.html")

@app.route("/favorites")
def favorites():
    return render_template("favorites.html")

@app.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
