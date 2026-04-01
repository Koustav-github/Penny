from database import SessionLocal
import models  # Ensure this matches your models file name

def add_test_user():
    # 1. Create a session
    db = SessionLocal()
    
    try:
        # 2. Create a new user instance
        # (Using 'clerk_id' based on your migration logs)

        # id = Column(Integer, primary_key=True, unique=True, index=True)
        # clerk_id = Column(Integer, primary_key=True, index=True, nullable=False)
        # email = Column(String, unique=True, index=True, nullable=False)
        # password = Column(String, nullable=False)
        # net_asset = Column(Float, default = 0.0)
        # created_at = Column(DateTime(timezone=True), server_default=func.now())

        new_user = models.User(
            id = 12345,
            clerk_id= 23456,
            email="test@example.com",
            password = "main chutiya hun",
            net_asset = 0.0
        )
        
        # 3. Add and Commit
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"Success! User created with ID: {new_user.id}")
        
    except Exception as e:
        print(f"Error occurred: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_test_user()