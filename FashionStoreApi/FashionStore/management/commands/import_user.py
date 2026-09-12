import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from cloudinary.uploader import upload
from FashionStore.models import User, Cart


class Command(BaseCommand):
    help = "Import users from CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)

    def handle(self, *args, **options):
        csv_file = options["csv_file"]
        logs = []
        success_count = 0
        skip_count = 0
        default_avatar_url = "https://avatarhub.edu.vn/wp-content/uploads/2025/12/avatar-mac-dinh-cua-fb-4-768x726.jpg"
        default_avatar = "default_vatatar"

        with open(csv_file, "r", encoding="utf-8-sig", newline="") as f:
            rows = list(csv.DictReader(f))

        total = len(rows)

        for index, row in enumerate(rows, 1):
            user_id = row.get("user_id", "").strip()
            avatar = row.get("avatar", "").strip()
            last_name = row.get("last_name", "").strip()
            first_name = row.get("first_name", "").strip()
            email = row.get("email", "").strip()
            password = row.get("password", "").strip()
            role = row.get("role", "").strip().upper()

            try:
                if not user_id:
                    raise ValueError("Thiếu user_id")

                if not email:
                    raise ValueError("Thiếu email")

                if not password:
                    raise ValueError("Thiếu password")

                if User.objects.filter(id=user_id).exists():
                    raise ValueError("user_id đã tồn tại")

                if User.objects.filter(email=email).exists():
                    raise ValueError("email đã tồn tại")

                username = email.split("@")[0].strip()

                if not username:
                    raise ValueError("Không tạo được username")

                if User.objects.filter(username=username).exists():
                    username = f"user_{user_id}"

                if role not in ["ADMIN", "STAFF", "CUSTOMER"]:
                    role = "CUSTOMER"

                if not avatar or avatar == default_avatar_url:
                    public_id = default_avatar
                else:
                    result = upload(avatar, folder="avatars", timeout=30)
                    public_id = result["public_id"]

                user = User.objects.create(
                    id=user_id,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    email=email,
                    password=make_password(password),
                    role=role,
                    is_active=True,
                    is_approved=True,
                    avatar=public_id,
                )

                Cart.objects.create(user=user)

                success_count += 1
                logs.append([index, user_id, email, "SUCCESS", ""])

            except Exception as e:
                skip_count += 1
                logs.append([index, user_id, email, "SKIP", str(e)])

            print(
                f"\rImporting users: {index}/{total} | Success: {success_count} | Skip: {skip_count}",
                end="",
            )

        log_file = Path(csv_file).parent / "import_users_log.csv"

        with open(log_file, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["row", "user_id", "email", "status", "reason"])
            writer.writerows(logs)

        print(
            f"\rImporting users: {total}/{total} | Success: {success_count} | Skip: {skip_count}"
        )
