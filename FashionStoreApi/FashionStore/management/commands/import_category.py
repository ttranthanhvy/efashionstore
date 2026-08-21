import csv

from django.core.management.base import BaseCommand
from FashionStore.models import Category


class Command(BaseCommand):
    help = "Import categories from CSV"
 
    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            type=str,
        )

    def handle(self, *args, **options):
        csv_file = options["csv_file"]

        rows = []

        # Đọc file CSV
        with open(csv_file, newline="", encoding="utf-8-sig") as file:
            reader = csv.DictReader(file)
            rows = list(reader)

        # Xóa dữ liệu cũ (nếu muốn import lại từ đầu)
        Category.objects.all().delete()

        category_map = {}

        # Import category cha
        for row in rows:

            if row["parent_id"].strip():
                continue

            category = Category.objects.create(
                id=int(row["category_id"]), name=row["name"].strip()
            )

            category_map[str(category.id)] = category

        # Import category con
        for row in rows:

            if not row["parent_id"].strip():
                continue

            parent_id = str(int(float(row["parent_id"])))

            parent = category_map.get(parent_id)

            if parent is None:
                self.stdout.write(
                    self.style.WARNING(f"Not find parent_id = {parent_id}")
                )
                continue

            category = Category.objects.create(
                id=int(row["category_id"]), name=row["name"].strip(), parent=parent
            )

            category_map[str(category.id)] = category

        self.stdout.write(
            self.style.SUCCESS(f"Import success {len(category_map)} category.")
        )
