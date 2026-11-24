---
title: Blog
permalink: "/blog/"
layout: default
---

# {{ page.title }}

<section class="blog-grid">
    {% for post in site.posts %}
        {% if post.featured_image %}
            <a href="{{ post.url }}" class="blog-item">
                <h3>{{ post.title }}</h3>
                <img src="{{ post.featured_image | replace: '../assets/', '/assets/' }}" alt="{{ post.title | escape }}" loading="{% if forloop.index <= 3 %}eager{% else %}lazy{% endif %}" decoding="async" />
            </a>
        {% endif %}
    {% endfor %}
</section>
