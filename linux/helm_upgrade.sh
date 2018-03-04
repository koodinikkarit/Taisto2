IMAGE_TAG="$CI_COMMIT_REF_NAME-$CI_COMMIT_SHA"

RELEASE_NAME=$(echo "$CI_COMMIT_REF_NAME" | sed 's/\./-/g')

helm upgrade \
	--wait \
	--set taistoImage=jaska/taisto:$IMAGE_TAG \
	--install $RELEASE_NAME ./deployment
