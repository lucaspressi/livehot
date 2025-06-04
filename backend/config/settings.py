class Config:
    SECRET_KEY = 'livehot-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
