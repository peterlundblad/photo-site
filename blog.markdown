---
title: Blog
permalink: "/blog/"
layout: default
---

# {{ page.title }}

<section class="blog-grid">
    {% for post in site.posts limit:40 %}
        <a href="{{ post.url }}" class="blog-item">
            {% if post.featured_image %}
                <h3>{{ post.title }}</h3>
                <img src="{{ post.featured_image }}" alt="{{ post.title }}" />
            {% endif %}
        </a>
    {% endfor %}
</section>

