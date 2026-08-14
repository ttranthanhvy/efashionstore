import csv

from cloudinary.uploader import upload
from django.core.management.base import BaseCommand

from FashionStore.models import Product, Category


class Command(BaseCommand):
    help = "Import products from CSV"

    def add_arguments(self, parser):
        parser.add_argument(
            "csv_file",
            type=str
        )

    def handle(self, *args, **options):

        csv_file = options["csv_file"]

        # =========================
        # Đọc CSV
        # =========================
        with open(
            csv_file,
            newline="",
            encoding="utf-8-sig"
        ) as file:

            reader = csv.DictReader(file)
            rows = list(reader)

        self.stdout.write(
            f"Đọc được {len(rows)} product."
        )

        # =========================
        # Xóa Product cũ
        # =========================
        Product.objects.all().delete()

        # =========================
        # Load Category một lần
        # =========================
        category_map = {
            category.id: category
            for category in Category.objects.all()
        }

        success_count = 0
        skip_count = 0

        # Dùng để kiểm tra product trùng tên
        product_names = set()

        # =========================
        # Import Product
        # =========================
        for row in rows:

            # -------------------------
            # Name
            # -------------------------
            name = row["name"].strip()

            if not name:
                skip_count += 1
                continue

            # -------------------------
            # Check duplicate name
            # -------------------------
            if name in product_names:
                skip_count += 1
                continue

            # -------------------------
            # Category
            # -------------------------
            category_id = int(
                float(row["category_id"])
            )

            category = category_map.get(category_id)

            if category is None:
                skip_count += 1
                continue

            # -------------------------
            # Thumbnail
            # -------------------------
            thumbnail_url = row["thumbnail"].strip()

            if not thumbnail_url:
                skip_count += 1
                continue

            # -------------------------
            # Upload Cloudinary
            # -------------------------
            result = upload(thumbnail_url)

            public_id = result["public_id"]

            # -------------------------
            # Description
            # -------------------------
            description = row["description"].strip()

            if not description:
                description = None

            # -------------------------
            # Quantity sold
            # -------------------------
            quantity_sold = int(
                float(row["quantity_sold"])
            )

            # -------------------------
            # Rating
            # -------------------------
            rating_average = float(
                row["rating_average"]
            )

            # -------------------------
            # Create Product
            # -------------------------
            Product.objects.create(
                id=int(row["product_id"]),
                name=name,
                description=description,
                thumbnail=public_id,
                price=row["price"],
                quantity_sold=quantity_sold,
                average_rating=rating_average,
                category=category
            )

            # Đánh dấu name đã sử dụng
            product_names.add(name)

            success_count += 1

        # =========================
        # Kết quả
        # =========================
        self.stdout.write(
            self.style.SUCCESS(
                f"Import success {success_count} product."
            )
        )

        if skip_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"Skip {skip_count} product."
                )
            )