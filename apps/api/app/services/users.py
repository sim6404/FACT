from app.services import seed_data


def get_current_user():
    return seed_data.USERS[0]


def list_users():
    return seed_data.USERS


def list_roles():
    return seed_data.ROLES
