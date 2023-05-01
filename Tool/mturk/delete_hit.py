from create_client import create_client
_, client = create_client()

response = client.delete_hit(HITId='')
