from django.db import models
from django.contrib.auth.models import User

REASEARCH_AREAS = [
    ('healthcare', 'Healthcare Economics'),
    ('ai', 'AI & Economics'),
    ('business', 'Business Strategy'),
    ('policy', 'Public Policy'),
    ('behavioral', 'Behavioral Economics'),
    ('steam', 'STEAM'),
]

STATUS_CHOICES = [
    ('pending', 'Pending Review'),
    ('published', 'Published'),
]

class Article(models.Model):
    title = models.CharField(max_length=200)
    author_name = models.CharField(max_length=100)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    research_area = models.CharField(max_length=20, choices=REASEARCH_AREAS)
    summary = models.TextField()
    file = models.FileField(upload_to='journal_submissions/')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-submitted_at']
