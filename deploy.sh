USER=yaskevich
APP=elemental
BRANCH=master
PROD=production
DIR=$(pwd)
WORK=$DIR/$PROD/$APP
TEMP=$DIR/$APP-$(date +"%Y%m%dT%H%M%S")

# degit $USER/$APP#$BRANCH $WORK
git clone https://github.com/$USER/$APP $TEMP --depth 1
HASH=$(git -C $TEMP rev-parse --short HEAD)
UNIX=$(git -C $TEMP log -1 --format=%ct)

rm $TEMP/* 2>/dev/null
rm $TEMP/.* 2>/dev/null

npm install --prefix $TEMP/client

if [ $? -eq 0 ]
then
  echo "CLIENT INSTALL SUCCESS"
else
  echo "CLIENT INSTALL FAIL"
  exit
fi

npm run build --prefix $TEMP/client
if [ $? -eq 0 ]
then
  echo "CLIENT BUILD SUCCESS"
else
  echo "CLIENT BUILD FAIL"
  exit
fi

mv $TEMP/client/dist $TEMP/public

for i in $TEMP/server/*
do
  if [ -f "$i" ]; then
    # echo "COPY $i"
    mv "$i" $TEMP
  fi
done

npm install --prefix $TEMP

if [ $? -eq 0 ]
then
  echo "SERVER INSTALL SUCCESS"
else
  echo "SERVER INSTALL FAIL"
  exit
fi

npm audit fix --prefix $TEMP

# echo "SET ENV"
cp $DIR/$APP.env $TEMP/.env
printf "\nCOMMIT=%s" $HASH >> $TEMP/.env
printf "\nCOMMITUNIX=%s" $UNIX >> $TEMP/.env

# echo "CLEAN"
rm -rf $TEMP/client $TEMP/server $TEMP/.git

# echo "LINK ASSETS"

mkdir $DIR/assets/$APP/backups -p
ln -s $DIR/assets/$APP/backups $TEMP

mkdir $DIR/assets/$APP/images -p
ln -s $DIR/assets/$APP/images $TEMP

mkdir $DIR/assets/$APP/sites -p
ln -s $DIR/assets/$APP/sites $TEMP

# echo "STOP NODEJS"
pm2 delete $APP

# echo "LINK APP"
rm $WORK 2>/dev/null
ln -s $TEMP $WORK

# echo "RUN NODEJS"
# cd $WORK
# # https://pm2.keymetrics.io/docs/usage/application-declaration/#ecosystem-file
pm2 start $WORK/ecosystem.config.cjs --cwd $WORK --update-env
pm2 save
