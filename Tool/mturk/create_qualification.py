from create_client import create_client

_, client = create_client()


response = client.create_qualification_type(
    Name='Coreference Main Task',
    Keywords='coreference, sentence, annotation',
    Description='Granted upon successfully completing the Coreference Annotation Tutorial (limited slots).',
    QualificationTypeStatus='Active'
)
print(response)